type Tokens = { accessToken: string; refreshToken: string; venueId?: string | null; djId?: string; liveSessionId?: string | null };

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:3000";
export const getApiBaseUrl = () => API_BASE_URL;
const DJ_TOKEN_KEY = "dj_access_token";
const DJ_REFRESH_KEY = "dj_refresh_token";
const DJ_VENUE_KEY = "dj_venue_id";
const DJ_SESSION_ID_KEY = "dj_live_session_id";

const getSessionItem = (key: string) => sessionStorage.getItem(key);
const setSessionItem = (key: string, value: string) => {
	sessionStorage.setItem(key, value);
};
const removeSessionItem = (key: string) => {
	sessionStorage.removeItem(key);
};

export const getAccessToken = () => getSessionItem(DJ_TOKEN_KEY);
const getRefreshToken = () => getSessionItem(DJ_REFRESH_KEY);

// ---- Proactive refresh timer ----
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const cancelProactiveRefresh = () => {
	if (proactiveRefreshTimer) {
		clearTimeout(proactiveRefreshTimer);
		proactiveRefreshTimer = null;
	}
};

const scheduleProactiveRefresh = () => {
	cancelProactiveRefresh();
	const token = getAccessToken();
	if (!token) return;
	const expiryMs = getJwtExpiryMs(token);
	if (!expiryMs) return;
	// Refresh 2 minutes before expiry, minimum 5 seconds from now
	const delay = Math.max(expiryMs - Date.now() - 120_000, 5_000);
	proactiveRefreshTimer = setTimeout(async () => {
		try {
			await refreshDjSessionSingleFlight();
		} catch {
			// Will be retried on next API call
		}
	}, delay);
};
// ---- end proactive refresh ----

const setTokens = (tokens: Tokens) => {
	setSessionItem(DJ_TOKEN_KEY, tokens.accessToken);
	setSessionItem(DJ_REFRESH_KEY, tokens.refreshToken);
	if (tokens.venueId) {
		setSessionItem(DJ_VENUE_KEY, tokens.venueId);
	} else {
		removeSessionItem(DJ_VENUE_KEY);
	}
	if (tokens.liveSessionId) {
		setSessionItem(DJ_SESSION_ID_KEY, tokens.liveSessionId);
	}
	scheduleProactiveRefresh();
};

export const clearTokens = () => {
	cancelProactiveRefresh();
	removeSessionItem(DJ_TOKEN_KEY);
	removeSessionItem(DJ_REFRESH_KEY);
	removeSessionItem(DJ_VENUE_KEY);
	removeSessionItem(DJ_SESSION_ID_KEY);
};

export const getSessionVenueId = () => getSessionItem(DJ_VENUE_KEY);
export const getLiveSessionId = () => getSessionItem(DJ_SESSION_ID_KEY);
export const setLiveSessionId = (id: string) => setSessionItem(DJ_SESSION_ID_KEY, id);

const getDjCredentials = () => {
	const username = getSessionItem("dj_username");
	const authKey = getSessionItem("dj_authKey");
	if (!username || !authKey) {
		return null;
	}
	return { username, authKey };
};

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const getJwtExpiryMs = (token: string) => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { exp?: number };
		if (!payload.exp) {
			return null;
		}
		return payload.exp * 1000;
	} catch {
		return null;
	}
};

const isAccessTokenExpiredOrNearExpiry = (token: string, skewMs = 15_000) => {
	const expiryMs = getJwtExpiryMs(token);
	if (!expiryMs) {
		return false;
	}
	return Date.now() + skewMs >= expiryMs;
};

let refreshInFlight: Promise<Tokens> | null = null;

const refreshDjSession = async () => {
	const refreshToken = getRefreshToken();
	if (!refreshToken) {
		throw new Error("no_refresh_token");
	}

	const response = await fetch(buildUrl("/auth/refresh"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken })
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || response.statusText);
	}

	const tokens = (await response.json()) as Tokens;
	setTokens(tokens);
	return tokens;
};

const refreshDjSessionSingleFlight = async () => {
	if (refreshInFlight) {
		return refreshInFlight;
	}

	refreshInFlight = (async () => {
		try {
			return await refreshDjSession();
		} finally {
			refreshInFlight = null;
		}
	})();

	return refreshInFlight;
};

const reauthenticateDjSession = async () => {
	const credentials = getDjCredentials();
	if (!credentials) {
		throw new Error("no_stored_credentials");
	}

	const tokens = await requestJson<Tokens>(
		"/auth/dj/login",
		{
			method: "POST",
			body: JSON.stringify(credentials)
		},
		false,
		false
	);

	setTokens(tokens);
	return tokens;
};

export const requestJson = async <T>(path: string, options: RequestInit = {}, includeAuth = true, retry = true): Promise<T> => {
	const headers = new Headers(options.headers ?? {});
	headers.set("Content-Type", "application/json");

	// If this request requires auth, ensure we have a valid access token first.
	if (includeAuth) {
		let token = getAccessToken();
		if (!token || isAccessTokenExpiredOrNearExpiry(token)) {
			// Try to recover the session (refresh or reauth). If this fails,
			// throw so callers see an unauthorized error instead of sending
			// a request with no auth header which results in a 401 from server.
			try {
				await ensureDjSession();
			} catch (err) {
				clearTokens();
				throw new Error('unauthorized');
			}
			token = getAccessToken();
		}
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
	}

	const response = await fetch(buildUrl(path), { ...options, headers });
	if (response.status === 401 && includeAuth && retry) {
		try {
			await refreshDjSessionSingleFlight();
			return requestJson<T>(path, options, includeAuth, false);
		} catch {
			clearTokens();
			throw new Error("unauthorized");
		}
	}
	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || response.statusText);
	}
	if (response.status === 204) {
		return {} as T;
	}
	return response.json() as Promise<T>;
};

export const djLogin = async (username: string, authKey: string) => {
	const tokens = await requestJson<Tokens>("/auth/dj/login", {
		method: "POST",
		body: JSON.stringify({ username, authKey })
	}, false);
	setTokens(tokens);
	return tokens;
};

export const ensureDjSession = async () => {
	const token = getAccessToken();
	if (token && !isAccessTokenExpiredOrNearExpiry(token)) {
		return;
	}
	if (getRefreshToken()) {
		await refreshDjSessionSingleFlight();
		return;
	}
	if (getDjCredentials()) {
		await reauthenticateDjSession();
		return;
	}
	throw new Error("no_session");
};

export const getSocketUrl = () => (import.meta as any).env?.VITE_SOCKET_URL ?? API_BASE_URL;
