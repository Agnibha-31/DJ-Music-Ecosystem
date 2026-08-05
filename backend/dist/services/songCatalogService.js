import { readFile } from "fs/promises";
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import { emitAdminEvent } from "../socket/io.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const catalogPath = join(__dirname, "..", "..", "songs_by_genre.json");
let catalogCache = null;
let isWatcherInitialized = false;
let debounceTimer = null;
const loadCatalogFromDisk = async () => {
    const fileContent = await readFile(catalogPath, "utf-8");
    return JSON.parse(fileContent);
};
export const getSongCatalog = async () => {
    if (catalogCache) {
        return catalogCache;
    }
    catalogCache = await loadCatalogFromDisk();
    env.logger.info({ source: catalogPath }, "Song catalog cache loaded");
    return catalogCache;
};
const refreshCatalogCache = async (reason) => {
    try {
        catalogCache = await loadCatalogFromDisk();
        env.logger.info({ source: catalogPath, reason }, "Song catalog cache refreshed");
        try {
            emitAdminEvent("songs.database.updated", { meta: { reason, updatedAt: new Date().toISOString() } });
        }
        catch (error) {
            env.logger.warn({ error: error instanceof Error ? error.message : "Unknown error" }, "Song catalog update broadcast failed");
        }
    }
    catch (error) {
        env.logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Failed to refresh song catalog cache");
    }
};
export const initSongCatalogWatcher = () => {
    if (isWatcherInitialized)
        return;
    isWatcherInitialized = true;
    void refreshCatalogCache("init");
    fs.watch(catalogPath, { persistent: false }, () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            void refreshCatalogCache("file_change");
        }, 300);
    });
    env.logger.info({ source: catalogPath }, "Song catalog watcher initialized");
};
