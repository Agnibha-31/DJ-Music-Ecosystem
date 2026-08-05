type Tokens = { accessToken: string; refreshToken: string };

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:3000";
const GUEST_TOKEN_KEY = "queue_access_token";
const GUEST_REFRESH_KEY = "queue_refresh_token";

export const getAccessToken = () => localStorage.getItem(GUEST_TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(GUEST_REFRESH_KEY);

const setTokens = (tokens: Tokens) => {
	localStorage.setItem(GUEST_TOKEN_KEY, tokens.accessToken);
	localStorage.setItem(GUEST_REFRESH_KEY, tokens.refreshToken);
	scheduleProactiveRefresh();
};

export const clearTokens = () => {
	cancelProactiveRefresh();
	localStorage.removeItem(GUEST_TOKEN_KEY);
	localStorage.removeItem(GUEST_REFRESH_KEY);
};

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

// ---- JWT expiry helpers ----
const getJwtExpiryMs = (token: string) => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { exp?: number };
		if (!payload.exp) return null;
		return payload.exp * 1000;
	} catch {
		return null;
	}
};

const isAccessTokenExpiredOrNearExpiry = (token: string, skewMs = 15_000) => {
	const expiryMs = getJwtExpiryMs(token);
	if (!expiryMs) return false;
	return Date.now() + skewMs >= expiryMs;
};

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
	const delay = Math.max(expiryMs - Date.now() - 120_000, 5_000);
	proactiveRefreshTimer = setTimeout(async () => {
		try {
			await refreshGuestSession();
			scheduleProactiveRefresh();
		} catch { /* will retry on next API call */ }
	}, delay);
};
// ---- end proactive refresh ----

// ---- Token refresh ----
const refreshGuestSession = async () => {
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

export const requestJson = async <T>(path: string, options: RequestInit = {}, includeAuth = true, retry = true): Promise<T> => {
	const headers = new Headers(options.headers ?? {});
	headers.set("Content-Type", "application/json");
	if (includeAuth) {
		let token = getAccessToken();
		if (token && isAccessTokenExpiredOrNearExpiry(token)) {
			try {
				await refreshGuestSession();
				token = getAccessToken();
			} catch {
				// Refresh failed — get a new guest session
				clearTokens();
				await ensureGuestSession();
				token = getAccessToken();
			}
		}
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
	}

	const response = await fetch(buildUrl(path), { ...options, headers });
	if (response.status === 401 && includeAuth && retry) {
		try {
			await refreshGuestSession();
			return requestJson<T>(path, options, includeAuth, false);
		} catch {
			// Refresh failed — get a fresh guest session
			clearTokens();
			await ensureGuestSession();
			return requestJson<T>(path, options, includeAuth, false);
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

export const ensureGuestSession = async () => {
	const token = getAccessToken();
	if (token && !isAccessTokenExpiredOrNearExpiry(token)) {
		return;
	}
	if (getRefreshToken()) {
		try {
			await refreshGuestSession();
			return;
		} catch {
			// Refresh failed, get a completely new guest session below
			clearTokens();
		}
	}
	const tokens = await requestJson<Tokens>("/auth/guest", { method: "POST" }, false, false);
	setTokens(tokens);
};

export const getSocketUrl = () => (import.meta as any).env?.VITE_SOCKET_URL ?? API_BASE_URL;
