import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? "change_me";
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? "change_me_refresh";
const jwtAccessTtl = process.env.JWT_ACCESS_TTL ?? "15m";
const jwtRefreshTtl = process.env.JWT_REFRESH_TTL ?? "30d";
const dbPath = process.env.DB_PATH ?? "./db";

const logger = pino({ level: "info" });

export const env = {
  port,
  jwtSecret,
  jwtRefreshSecret,
  jwtAccessTtl,
  jwtRefreshTtl,
  dbPath,
  logger
};
