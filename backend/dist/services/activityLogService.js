import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { nowIso } from "../utils/time.js";
import { emitAdminEvent } from "../socket/io.js";
import { createReadableId } from "../utils/ids.js";
export const appendActivityLog = async (entry) => {
    const filePath = collectionPath("activity_logs.json");
    const data = await readJson(filePath);
    const timestamp = nowIso();
    const record = {
        id: createReadableId("log"),
        record_version: 1,
        schema_version: "1.0.0",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        created_by: entry.actor,
        updated_by: entry.actor,
        type: entry.type,
        description: entry.description,
        timestamp,
        user: entry.user,
        metadata: entry.metadata ?? {}
    };
    data.records.push(record);
    await writeJson(filePath, data);
    emitAdminEvent("activity_logs.updated", { log: record, meta: { createdAt: record.created_at, actorId: entry.actor.actor_id ?? null } });
};
