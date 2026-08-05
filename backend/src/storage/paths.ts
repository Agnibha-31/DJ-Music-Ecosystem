import path from "path";
import { env } from "../config/env.js";

export const DB_ROOT = path.resolve(process.cwd(), env.dbPath);
export const AUTH_ROOT = path.join(DB_ROOT, "auth");
export const COLLECTIONS_ROOT = path.join(DB_ROOT, "collections");
export const AUDIT_ROOT = path.join(DB_ROOT, "audit");

export const authPath = (fileName: string) => path.join(AUTH_ROOT, fileName);
export const collectionPath = (fileName: string) => path.join(COLLECTIONS_ROOT, fileName);
export const auditPath = (fileName: string) => path.join(AUDIT_ROOT, fileName);
