import { readJson } from "../storage/jsonStore.js";
import { authPath } from "../storage/paths.js";

type PermissionsFile = {
  schema_version: string;
  roles: { role: string; permissions: string[] }[];
};

export const getPermissionsForRole = async (role: string): Promise<string[]> => {
  const data = await readJson<PermissionsFile>(authPath("permissions.json"));
  const match = data.roles.find((entry) => entry.role === role);
  return match ? match.permissions : [];
};
