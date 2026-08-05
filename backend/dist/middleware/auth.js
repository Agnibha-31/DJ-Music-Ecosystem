import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getPermissionsForRole } from "../services/permissionsService.js";
const getToken = (header) => {
    if (!header)
        return null;
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token)
        return null;
    return token;
};
export const authenticateOptional = async (req, _res, next) => {
    const token = getToken(req.header("authorization"));
    if (!token) {
        req.auth = {
            subjectId: null,
            role: "public",
            permissions: await getPermissionsForRole("public"),
            sessionId: null
        };
        return next();
    }
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        req.auth = {
            subjectId: payload.sub ?? null,
            role: payload.role ?? "public",
            permissions: payload.permissions ?? (await getPermissionsForRole(payload.role ?? "public")),
            sessionId: payload.sessionId ?? null,
            sessionVersion: payload.sessionVersion ?? null
        };
        return next();
    }
    catch {
        req.auth = {
            subjectId: null,
            role: "public",
            permissions: await getPermissionsForRole("public"),
            sessionId: null,
            sessionVersion: null
        };
        return next();
    }
};
export const requireAuth = async (req, res, next) => {
    const token = getToken(req.header("authorization"));
    if (!token) {
        return res.status(401).json({ error: "unauthorized" });
    }
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        req.auth = {
            subjectId: payload.sub ?? null,
            role: payload.role ?? "public",
            permissions: payload.permissions ?? (await getPermissionsForRole(payload.role ?? "public")),
            sessionId: payload.sessionId ?? null,
            sessionVersion: payload.sessionVersion ?? null
        };
        return next();
    }
    catch {
        return res.status(401).json({ error: "unauthorized" });
    }
};
export const authorize = (permission) => {
    return async (req, res, next) => {
        const auth = req.auth;
        if (!auth) {
            return res.status(401).json({ error: "unauthorized" });
        }
        if (auth.permissions.includes("admin.full") || auth.permissions.includes(permission)) {
            return next();
        }
        return res.status(403).json({ error: "forbidden" });
    };
};
