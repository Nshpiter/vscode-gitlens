interface CacheEntry<T> {
	readonly value: T;
	readonly expiresAt: number;
}

/**
 * 带 TTL 过期机制的 LRU 缓存
 *
 * - 超过最大容量时自动淘汰最久未使用的条目
 * - 每个条目支持独立的 TTL（过期时间）
 * - get 操作会将条目提升为最近使用
 */
export class LRUCache<T> {
	private readonly _cache = new Map<string, CacheEntry<T>>();

	constructor(
		private readonly _maxSize: number = 100,
		private readonly _defaultTtlMs: number = 5 * 60 * 1000, // 默认 5 分钟
	) {}

	get size(): number {
		return this._cache.size;
	}

	get(key: string): T | undefined {
		const entry = this._cache.get(key);
		if (entry == null) return undefined;

		// 检查是否过期
		if (Date.now() > entry.expiresAt) {
			this._cache.delete(key);
			return undefined;
		}

		// LRU: 删除后重新插入，使其成为最近使用
		this._cache.delete(key);
		this._cache.set(key, entry);

		return entry.value;
	}

	set(key: string, value: T, ttlMs?: number): void {
		// 如果 key 已存在，先删除（保证插入顺序正确）
		if (this._cache.has(key)) {
			this._cache.delete(key);
		}

		// 淘汰最久未使用的条目
		while (this._cache.size >= this._maxSize) {
			const oldestKey = this._cache.keys().next().value;
			if (oldestKey !== undefined) {
				this._cache.delete(oldestKey);
			}
		}

		this._cache.set(key, {
			value: value,
			expiresAt: Date.now() + (ttlMs ?? this._defaultTtlMs),
		});
	}

	has(key: string): boolean {
		const entry = this._cache.get(key);
		if (entry == null) return false;

		if (Date.now() > entry.expiresAt) {
			this._cache.delete(key);
			return false;
		}

		return true;
	}

	delete(key: string): boolean {
		return this._cache.delete(key);
	}

	clear(): void {
		this._cache.clear();
	}
}
