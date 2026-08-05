import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
const STORAGE_REQUIREMENTS = [
    {
        filePath: 'db/collections/venue_song_selections.json',
        defaultContent: { records: [] },
        description: 'Venue song selection storage'
    },
    {
        filePath: 'db/auth/refresh_tokens.json',
        defaultContent: { records: [] },
        description: 'Refresh tokens storage'
    },
    {
        filePath: 'db/auth/admin_accounts.json',
        defaultContent: { records: [] },
        description: 'Admin accounts storage'
    },
    {
        filePath: 'db/auth/anonymous_sessions.json',
        defaultContent: { records: [] },
        description: 'Anonymous sessions storage'
    },
    {
        filePath: 'db/auth/jti_denylist.json',
        defaultContent: { records: [] },
        description: 'JWT denylist storage'
    },
    {
        filePath: 'db/auth/permissions.json',
        defaultContent: {
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
        },
        description: 'Role permissions configuration'
    }
];
/**
 * Ensures a directory exists, creating it if necessary
 */
const ensureDirectory = async (dirPath) => {
    try {
        await fs.access(dirPath);
    }
    catch {
        await fs.mkdir(dirPath, { recursive: true });
        env.logger.info({ directory: dirPath }, 'Created directory');
    }
};
/**
 * Ensures a file exists with valid JSON content
 */
const ensureFile = async (config) => {
    const fullPath = path.resolve(process.cwd(), config.filePath);
    const dirPath = path.dirname(fullPath);
    try {
        // Check if file exists and is readable
        await fs.access(fullPath);
        // Verify file contains valid JSON
        const content = await fs.readFile(fullPath, 'utf-8');
        JSON.parse(content);
        env.logger.debug({ file: config.filePath }, 'File exists and contains valid JSON');
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            // File doesn't exist, create it
            await ensureDirectory(dirPath);
            await fs.writeFile(fullPath, JSON.stringify(config.defaultContent, null, 2), 'utf-8');
            env.logger.info({ file: config.filePath, description: config.description }, 'Created storage file');
        }
        else {
            // File exists but is invalid (corrupted, empty, etc.)
            env.logger.warn({
                file: config.filePath,
                description: config.description,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, 'File exists but contains invalid JSON, recreating with defaults');
            await ensureDirectory(dirPath);
            await fs.writeFile(fullPath, JSON.stringify(config.defaultContent, null, 2), 'utf-8');
        }
    }
};
/**
 * Bootstraps all required storage files and directories
 * This must be called before any routes are registered
 */
export const bootstrapStorage = async () => {
    env.logger.info('Starting storage bootstrap...');
    try {
        const startTime = Date.now();
        // Process all storage requirements in parallel for better performance
        await Promise.all(STORAGE_REQUIREMENTS.map(async (config) => {
            await ensureFile(config);
        }));
        const duration = Date.now() - startTime;
        env.logger.info({
            duration: `${duration}ms`,
            filesProcessed: STORAGE_REQUIREMENTS.length
        }, 'Storage bootstrap completed successfully');
    }
    catch (error) {
        env.logger.fatal({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, 'Storage bootstrap failed');
        // Fail fast - if we can't initialize storage, we shouldn't start the server
        throw new Error(`Storage bootstrap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
/**
 * Validates that all required storage files are accessible
 * Can be used as a health check
 */
export const validateStorage = async () => {
    try {
        await Promise.all(STORAGE_REQUIREMENTS.map(async (config) => {
            const fullPath = path.resolve(process.cwd(), config.filePath);
            await fs.access(fullPath);
            const content = await fs.readFile(fullPath, 'utf-8');
            JSON.parse(content); // Validate JSON
        }));
        return true;
    }
    catch (error) {
        env.logger.error({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Storage validation failed');
        return false;
    }
};
