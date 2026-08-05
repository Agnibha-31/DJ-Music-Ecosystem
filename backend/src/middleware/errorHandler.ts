import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  env.logger.error({ err }, "request error");
  res.status(500).json({ error: "internal_error" });
};
