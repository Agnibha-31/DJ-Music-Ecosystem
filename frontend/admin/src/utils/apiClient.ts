type Tokens = { accessToken: string; refreshToken: string };

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:3000";
const ADMIN_TOKEN_KEY = "admin_access_token";
const ADMIN_REFRESH_KEY = "admin_refresh_token";

const getSessionItem = (key: string) => sessionStorage.getItem(key);
const setSessionItem = (key: string, value: string) => {
	sessionStorage.setItem(key, value);
	localStorage.removeItem(key);
};
const removeSessionItem = (key: string) => {
	sessionStorage.removeItem(key);
	localStorage.removeItem(key);
};

export const getAccessToken = () => getSessionItem(ADMIN_TOKEN_KEY);
const getRefreshToken = () => getSessionItem(ADMIN_REFRESH_KEY);

const setTokens = (tokens: Tokens) => {
	setSessionItem(ADMIN_TOKEN_KEY, tokens.accessToken);
	setSessionItem(ADMIN_REFRESH_KEY, tokens.refreshToken);
};

export const clearTokens = () => {
	cancelProactiveRefresh();
	removeSessionItem(ADMIN_TOKEN_KEY);
	removeSessionItem(ADMIN_REFRESH_KEY);
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
			await refreshAdminSession();
			scheduleProactiveRefresh();
		} catch { /* will retry on next API call */ }
	}, delay);
};
// ---- end proactive refresh ----

const refreshAdminSession = async () => {
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
	scheduleProactiveRefresh();
	return tokens;
};

export const requestJson = async <T>(path: string, options: RequestInit = {}, includeAuth = true, retry = true): Promise<T> => {
	const headers = new Headers(options.headers ?? {});
	headers.set("Content-Type", "application/json");
	if (includeAuth) {
		let token = getAccessToken();
		if (token && isAccessTokenExpiredOrNearExpiry(token)) {
			try {
				await refreshAdminSession();
				scheduleProactiveRefresh();
				token = getAccessToken();
			} catch {
				clearTokens();
				throw new Error("unauthorized");
			}
		}
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
	}

	const response = await fetch(buildUrl(path), { ...options, headers });
	if (response.status === 401 && includeAuth && retry) {
		try {
			await refreshAdminSession();
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

export const adminLogin = async (payload: { username?: string; email?: string; password: string }) => {
	const tokens = await requestJson<Tokens>("/auth/admin/login", {
		method: "POST",
		body: JSON.stringify(payload)
	}, false);
	setTokens(tokens);
	scheduleProactiveRefresh();
	return tokens;
};

export const adminSignup = async (payload: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => {
	const tokens = await requestJson<Tokens>("/auth/admin/signup", {
		method: "POST",
		body: JSON.stringify(payload)
	}, false);
	setTokens(tokens);
	scheduleProactiveRefresh();
	return tokens;
};

export const adminChangePassword = async (payload: { newPassword: string }) => {
	return requestJson<{ ok: boolean }>("/auth/admin/password", {
		method: "POST",
		body: JSON.stringify(payload)
	});
};

export const ensureAdminSession = async () => {
	const token = getAccessToken();
	if (token && !isAccessTokenExpiredOrNearExpiry(token)) {
		return;
	}
	if (getRefreshToken()) {
		await refreshAdminSession();
		scheduleProactiveRefresh();
		return;
	}
	throw new Error("no_session");
};

export const getSocketUrl = () => (import.meta as any).env?.VITE_SOCKET_URL ?? API_BASE_URL;
