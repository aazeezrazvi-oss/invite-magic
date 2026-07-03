interface CoalesceEntry {
  promise: Promise<any>;
  timestamp: number;
}

const activePromises = new Map<string, CoalesceEntry>();
const COLLAPSE_WINDOW_MS = 50; // Group requests arriving within 50ms of each other

/**
 * Deduplicates concurrent calls. If an active fetch is already running for the given key,
 * concurrent calls await the same promise instead of triggering new executions.
 */
export async function coalesceFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const active = activePromises.get(key);

  if (active && now - active.timestamp < COLLAPSE_WINDOW_MS) {
    return active.promise as Promise<T>;
  }

  const promise = fetchFn().finally(() => {
    // Once resolved/rejected, remove it so subsequent cycles can fetch fresh data
    activePromises.delete(key);
  });

  activePromises.set(key, { promise, timestamp: now });
  return promise;
}
