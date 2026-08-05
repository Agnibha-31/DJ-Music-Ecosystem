const locks = new Map<string, Promise<void>>();

export const withDirectoryLock = async <T>(dir: string, fn: () => Promise<T>): Promise<T> => {
  const previous = locks.get(dir) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });

  locks.set(dir, previous.then(() => next));
  await previous;

  try {
    return await fn();
  } finally {
    release();
    if (locks.get(dir) === next) {
      locks.delete(dir);
    }
  }
};
