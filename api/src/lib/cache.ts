type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class InMemoryTtlCache<T> {
  private readonly storage = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.storage.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.storage.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.storage.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}
