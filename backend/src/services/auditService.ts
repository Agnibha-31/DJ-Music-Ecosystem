import { readJson, writeJson } from "../storage/jsonStore.js";
import { auditPath } from "../storage/paths.js";
import { nowIso } from "../utils/time.js";
import type { Actor } from "../utils/records.js";
import { createReadableId } from "../utils/ids.js";

type AuditRecord = {
  id: string;
  record_version: number;
  schema_version: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: Actor;
  updated_by: Actor;
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete";
  before: unknown | null;
  after: unknown | null;
  correlation_id: string;
  reason: string | null;
};

type AuditFile = { schema_version: string; records: AuditRecord[] };

export const appendAudit = async (entry: {
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete";
  before: unknown | null;
  after: unknown | null;
  actor: Actor;
  reason?: string | null;
  correlationId?: string;
}) => {
  const filePath = auditPath("audit_log.json");
  const data = await readJson<AuditFile>(filePath);
  const timestamp = nowIso();
  const record: AuditRecord = {
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
