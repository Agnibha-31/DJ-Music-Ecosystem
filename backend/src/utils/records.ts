import { nowIso } from "./time.js";

export type Actor = { actor_type: string; actor_id: string | null };

export const createRecordBase = (actor: Actor) => {
  const timestamp = nowIso();
  return {
    record_version: 1,
    schema_version: "1.0.0",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null as string | null,
    created_by: actor,
    updated_by: actor
  };
};

export const bumpRecord = <T extends { record_version: number; updated_at: string; updated_by: Actor }>(
  record: T,
  actor: Actor
) => {
  return {
    ...record,
    record_version: record.record_version + 1,
    updated_at: nowIso(),
    updated_by: actor
  };
};
