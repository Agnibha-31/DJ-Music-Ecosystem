import { nowIso } from "./time.js";
export const createRecordBase = (actor) => {
    const timestamp = nowIso();
    return {
        record_version: 1,
        schema_version: "1.0.0",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        created_by: actor,
        updated_by: actor
    };
};
export const bumpRecord = (record, actor) => {
    return {
        ...record,
        record_version: record.record_version + 1,
        updated_at: nowIso(),
        updated_by: actor
    };
};
