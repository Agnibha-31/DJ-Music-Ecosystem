import { readJson, writeJson } from "../storage/jsonStore.js";
import { auditPath } from "../storage/paths.js";
import { nowIso } from "../utils/time.js";
import { createReadableId } from "../utils/ids.js";
export const appendAudit = async (entry) => {
    const filePath = auditPath("audit_log.json");
    const data = await readJson(filePath);
    const timestamp = nowIso();
    const record = {
        id: createReadableId("audit"),
        record_version: 1,
        schema_version: "1.0.0",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        created_by: entry.actor,
        updated_by: entry.actor,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        action: entry.action,
        before: entry.before,
        after: entry.after,
        correlation_id: entry.correlationId ?? createReadableId("evt"),
        reason: entry.reason ?? null
    };
    data.records.push(record);
    await writeJson(filePath, data);
};
