export function getCachedInitialization<T>(
    cache: WeakMap<object, Promise<T>>,
    key: object,
    initialize: () => Promise<T>,
): Promise<T> {
    const cached = cache.get(key);
    if (cached) return cached;

    const pending = Promise.resolve().then(initialize).catch((error: unknown) => {
        if (cache.get(key) === pending) cache.delete(key);
        throw error;
    });
    cache.set(key, pending);
    return pending;
}
