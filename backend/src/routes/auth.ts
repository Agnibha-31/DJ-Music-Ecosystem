import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { authPath, collectionPath } from "../storage/paths.js";
import { nowIso } from "../utils/time.js";
import { createRecordBase } from "../utils/records.js";
import { requireAuth } from "../middleware/auth.js";
import { createReadableId } from "../utils/ids.js";

const router = Router();

const issueTokens = (payload: {
  sub: string;
  role: "admin" | "dj" | "public";
  permissions: string[];
  sessionId?: string | null;
  sessionVersion?: number | null;
}) => {
  const accessToken = jwt.sign(payload, env.jwtSecret as string, { expiresIn: env.jwtAccessTtl as string } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret as string, { expiresIn: env.jwtRefreshTtl as string } as jwt.SignOptions);
  return { accessToken, refreshToken };
};

router.post("/auth/admin/login", async (req, res) => {
  const { username, email, password } = req.body as { username?: string; email?: string; password: string };
  const normalizedUsername = String(username ?? "").trim();
  const normalizedEmail = String(email ?? "").trim();
  if (!normalizedUsername && !normalizedEmail) {
    return res.status(400).json({ error: "missing_identifier" });
  }
  const data = await readJson<{ records: any[] }>(authPath("admin_accounts.json"));
  const account = data.records.find((item) =>
    item.status === "active" &&
    ((normalizedUsername && item.username === normalizedUsername) || (normalizedEmail && item.email === normalizedEmail))
  );

  if (!account) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const hash = account.passwordHash as string;
  const matches = hash.startsWith("plaintext:")
    ? hash.replace("plaintext:", "") === password
    : await bcrypt.compare(password, hash);

  if (!matches) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const permsData = await readJson<{ roles: { role: string; permissions: string[] }[] }>(authPath("permissions.json"));
  const perms = permsData.roles.find((entry) => entry.role === "admin")?.permissions ?? [];
  const tokens = issueTokens({ sub: account.id, role: "admin", permissions: perms });

  const refreshData = await readJson<{ records: any[] }>(authPath("refresh_tokens.json"));
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  // Ensure records array exists
  if (!refreshData.records) {
    refreshData.records = [];
  }
  refreshData.records.push({
    id: createReadableId("refresh"),
    ...createRecordBase({ actor_type: "system", actor_id: null }),
    subjectId: account.id,
    role: "admin",
    issuedAt: nowIso(),
    expiresAt: refreshExpiresAt,
    revoked: false
  });
  await writeJson(authPath("refresh_tokens.json"), refreshData);

  return res.json(tokens);
});

router.post("/auth/admin/signup", async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body as {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  };
  const normalizedUsername = String(username ?? "").trim();
  const normalizedEmail = String(email ?? "").trim();
  const normalizedPassword = String(password ?? "").trim();

  if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ error: "missing_fields" });
  }

  const data = await readJson<{ records: any[] }>(authPath("admin_accounts.json"));
  const exists = data.records.find((item) =>
    item.username === normalizedUsername || item.email === normalizedEmail
  );
  if (exists) {
    return res.status(409).json({ error: "account_exists" });
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 12);
  const timestamp = nowIso();
  const record = {
    id: createReadableId("admin"),
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: "system",
    updatedBy: "system",
    firstName: firstName ? String(firstName).trim() : undefined,
    lastName: lastName ? String(lastName).trim() : undefined
  };

  data.records.push(record);
  await writeJson(authPath("admin_accounts.json"), data);

  const permsData = await readJson<{ roles: { role: string; permissions: string[] }[] }>(authPath("permissions.json"));
  const perms = permsData.roles.find((entry) => entry.role === "admin")?.permissions ?? [];
  const tokens = issueTokens({ sub: record.id, role: "admin", permissions: perms });

  const refreshData = await readJson<{ records: any[] }>(authPath("refresh_tokens.json"));
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  if (!refreshData.records) {
    refreshData.records = [];
  }
  refreshData.records.push({
    id: createReadableId("refresh"),
    ...createRecordBase({ actor_type: "system", actor_id: null }),
    subjectId: record.id,
    role: "admin",
    issuedAt: nowIso(),
    expiresAt: refreshExpiresAt,
    revoked: false
  });
  await writeJson(authPath("refresh_tokens.json"), refreshData);

  return res.status(201).json(tokens);
});

router.post("/auth/admin/password", requireAuth, async (req, res) => {
  if (!req.auth || req.auth.role !== "admin" || !req.auth.subjectId) {
    return res.status(403).json({ error: "forbidden" });
  }

  const { newPassword } = req.body as { newPassword?: string };
  const normalizedPassword = String(newPassword ?? "").trim();

  if (!normalizedPassword || normalizedPassword.length < 8) {
    return res.status(400).json({ error: "invalid_password" });
  }

  const data = await readJson<{ records: any[] }>(authPath("admin_accounts.json"));
  const account = data.records.find((item) => item.id === req.auth?.subjectId);

  if (!account) {
    return res.status(404).json({ error: "account_not_found" });
  }

  account.passwordHash = await bcrypt.hash(normalizedPassword, 12);
  account.updatedAt = nowIso();
  account.updatedBy = req.auth.subjectId;

  await writeJson(authPath("admin_accounts.json"), data);

  return res.json({ ok: true });
});

router.post("/auth/dj/login", async (req, res) => {
  const { username, authKey } = req.body as { username: string; authKey: string };
  const djData = await readJson<{ records: any[] }>(collectionPath("djs.json"));
  const accountIndex = djData.records.findIndex((item) => item.username === username && item.authKey === authKey);
  const account = accountIndex === -1 ? null : djData.records[accountIndex];

  if (!account || !account.authenticated) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const nextSessionVersion = Number(account.sessionVersion ?? 0) + 1;
  account.sessionVersion = nextSessionVersion;
  account.sessionIssuedAt = nowIso();
  djData.records[accountIndex] = account;
  await writeJson(collectionPath("djs.json"), djData);

  const permsData = await readJson<{ roles: { role: string; permissions: string[] }[] }>(authPath("permissions.json"));
  const perms = permsData.roles.find((entry) => entry.role === "dj")?.permissions ?? [];
  const tokens = issueTokens({
    sub: account.id,
    role: "dj",
    permissions: perms,
    sessionVersion: nextSessionVersion
  });

  const refreshData = await readJson<{ records: any[] }>(authPath("refresh_tokens.json"));
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  refreshData.records.push({
    id: createReadableId("refresh"),
    ...createRecordBase({ actor_type: "system", actor_id: null }),
    subjectId: account.id,
    role: "dj",
    issuedAt: nowIso(),
    expiresAt: refreshExpiresAt,
    revoked: false
  });
  await writeJson(authPath("refresh_tokens.json"), refreshData);

  // Look up active or suspended live session for this DJ at their assigned venue
  const sessionsData = await readJson<{ records: any[] }>(collectionPath("live_sessions.json"));
  let activeSession = sessionsData.records.find(
    (s) => s.djId === account.id && s.venueId === account.venueId && s.status === "active" && !s.deleted_at
  ) ?? null;

  // If no active session, check for a suspended one and reactivate it
  if (!activeSession) {
    const suspendedIndex = sessionsData.records.findIndex(
      (s) => s.djId === account.id && s.venueId === account.venueId && s.status === "suspended" && !s.deleted_at
    );
    if (suspendedIndex !== -1) {
      const suspended = sessionsData.records[suspendedIndex];
      const reactivated = { ...suspended, status: "active", updated_at: new Date().toISOString() };
      sessionsData.records[suspendedIndex] = reactivated;
      await writeJson(collectionPath("live_sessions.json"), sessionsData);
      activeSession = reactivated;
    }
  }

  return res.json({ ...tokens, venueId: account.venueId ?? null, djId: account.id, liveSessionId: activeSession?.id ?? null });
});

router.post("/auth/guest", async (_req, res) => {
  const sessionId = createReadableId("sess");
  const anonData = await readJson<{ records: any[] }>(authPath("anonymous_sessions.json"));
  anonData.records.push({
    id: sessionId,
    ...createRecordBase({ actor_type: "system", actor_id: null }),
    sessionId,
    lastSeen: nowIso(),
    ipHash: ""
  });
  await writeJson(authPath("anonymous_sessions.json"), anonData);

  const permsData = await readJson<{ roles: { role: string; permissions: string[] }[] }>(authPath("permissions.json"));
  const perms = permsData.roles.find((entry) => entry.role === "public")?.permissions ?? [];
  const tokens = issueTokens({ sub: `guest_${sessionId}`, role: "public", permissions: perms, sessionId });

  return res.json(tokens);
});

router.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as {
      sub: string;
      role: "admin" | "dj" | "public";
      permissions: string[];
      sessionId?: string | null;
      sessionVersion?: number | null;
    };

    if (payload.role === "dj") {
      const djData = await readJson<{ records: any[] }>(collectionPath("djs.json"));
      const account = djData.records.find((item) => item.id === payload.sub && !item.deleted_at);
      if (!account || !account.authenticated) {
        return res.status(401).json({ error: "invalid_refresh" });
      }

      const currentSessionVersion = Number(account.sessionVersion ?? 0);
      const tokenSessionVersion = Number(payload.sessionVersion ?? 0);
      if (tokenSessionVersion && currentSessionVersion - tokenSessionVersion > 1) {
        return res.status(401).json({ error: "invalid_refresh" });
      }
    }

    const tokens = issueTokens({
      sub: payload.sub,
      role: payload.role,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
      sessionVersion: payload.sessionVersion ?? null
    });

    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: "invalid_refresh" });
  }
});

router.post("/auth/logout", async (req, res) => {
  const { jti } = req.body as { jti: string };
  const denyData = await readJson<{ records: any[] }>(authPath("jti_denylist.json"));
  denyData.records.push({
    id: createReadableId("deny"),
    ...createRecordBase({ actor_type: "system", actor_id: null }),
    jti,
    revokedAt: nowIso(),
    reason: "logout"
  });
  await writeJson(authPath("jti_denylist.json"), denyData);
  res.json({ ok: true });
});

export default router;
