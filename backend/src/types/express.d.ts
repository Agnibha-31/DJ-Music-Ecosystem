import "express";
import type { AuthContext } from "../middleware/auth.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}
