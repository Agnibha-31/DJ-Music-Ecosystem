const randomSuffix = (length = 6) => Math.random().toString(36).slice(2, 2 + length);
export const createReadableId = (prefix) => `${prefix}_${Date.now()}_${randomSuffix()}`;
