import { readJson } from "../storage/jsonStore.js";
import { authPath } from "../storage/paths.js";
export const getPermissionsForRole = async (role) => {
    const data = await readJson(authPath("permissions.json"));
    const match = data.roles.find((entry) => entry.role === role);
    return match ? match.permissions : [];
};
