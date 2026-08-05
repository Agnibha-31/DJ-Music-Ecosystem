import fs from "fs/promises";
import path from "path";
import { withDirectoryLock } from "./lock.js";
import { env } from "../config/env.js";
const DEFAULT_CONTENTS = {
    'db/collections/venue_song_selections.json': { records: [] },
    'db/auth/refresh_tokens.json': { records: [] },
    'db/auth/admin_accounts.json': { records: [] },
    'db/auth/anonymous_sessions.json': { records: [] },
    'db/auth/jti_denylist.json': { records: [] },
    'db/auth/permissions.json': {
        roles: [
            {
                role: 'admin',
                permissions: ['admin.full']
            },
            {
                role: 'dj',
                permissions: [
                    'dj.basic',
                    'dj.queue',
                    'songs.catalog.read',
                    'queue.read',
                    'queue.insert',
                    'queue.accept',
                    'queue.reject',
                    'queue.revert',
                    'queue.vote'
                ]
            },
            {
                role: 'public',
                permissions: [
                    'songs.catalog.read',
                    'queue.read',
                    'queue.request',
                    'queue.vote'
                ]
            }
        ]
    }
};
export const readJson = async (filePath, defaultValue) => {
    try {
        const raw = await fs.readFile(filePath, "utf-8");
        // Handle empty files
        if (!raw.trim()) {
            env.logger.warn({ file: filePath }, 'File is empty, returning default value');
            return defaultValue ?? DEFAULT_CONTENTS[filePath] ?? {};
        }
        return JSON.parse(raw);
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            env.logger.warn({ file: filePath }, 'File does not exist, returning default value');
            return defaultValue ?? DEFAULT_CONTENTS[filePath] ?? {};
        }
        // Handle JSON parse errors or other file issues
        env.logger.warn({
            file: filePath,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Failed to read JSON file, returning default value');
        return defaultValue ?? DEFAULT_CONTENTS[filePath] ?? {};
    }
};
export const writeJson = async (filePath, data) => {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await withDirectoryLock(dir, async () => {
        const tmpPath = `${filePath}.tmp`;
        await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
        try {
            // Try to remove the original file first (handles file locks on Windows)
            await fs.unlink(filePath).catch(() => {
                // File doesn't exist yet, which is fine
            });
        }
        catch {
            // Continue even if unlink fails
        }
        await fs.rename(tmpPath, filePath);
    });
};
export const updateJsonAtomically = async (filePath, updater, defaultValue) => {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    return withDirectoryLock(dir, async () => {
        let current;
        try {
            const raw = await fs.readFile(filePath, "utf-8");
            if (!raw.trim()) {
                current = (defaultValue ?? DEFAULT_CONTENTS[filePath] ?? {});
            }
            else {
                current = JSON.parse(raw);
            }
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                current = (defaultValue ?? DEFAULT_CONTENTS[filePath] ?? {});
            }
            else {
                env.logger.warn({
                    file: filePath,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }, 'Failed to read JSON file in atomic update, using default value');
                current = (defaultValue ?? DEFAULT_CONTENTS[filePath] ?? {});
            }
        }
        const { next, result } = await updater(current);
        const tmpPath = `${filePath}.tmp`;
        await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), "utf-8");
        try {
            await fs.unlink(filePath).catch(() => {
            });
        }
        catch {
        }
        await fs.rename(tmpPath, filePath);
        return result;
    });
};
