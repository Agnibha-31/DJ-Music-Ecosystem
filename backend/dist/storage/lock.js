const locks = new Map();
export const withDirectoryLock = async (dir, fn) => {
    const previous = locks.get(dir) ?? Promise.resolve();
    let release = () => undefined;
    const next = new Promise((resolve) => {
        release = resolve;
    });
    locks.set(dir, previous.then(() => next));
    await previous;
    try {
        return await fn();
    }
    finally {
        release();
        if (locks.get(dir) === next) {
            locks.delete(dir);
        }
    }
};
