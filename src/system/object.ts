/**
 * Deep equality comparison (lightweight replacement for lodash-es isEqual).
 * Handles primitives, Date, RegExp, Array, plain objects, Map, and Set.
 */
export function areEqual(a: any, b: any): boolean {
	if (a === b) return true;
	if (a == null || b == null) return a === b;
	if (typeof a !== typeof b) return false;

	if (typeof a === 'number' && typeof b === 'number') {
		if (Number.isNaN(a) && Number.isNaN(b)) return true;
		return a === b;
	}

	if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
	if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;

	if (a instanceof Map && b instanceof Map) {
		if (a.size !== b.size) return false;
		for (const [key, val] of a) {
			if (!b.has(key) || !areEqual(val, b.get(key))) return false;
		}
		return true;
	}

	if (a instanceof Set && b instanceof Set) {
		if (a.size !== b.size) return false;
		for (const val of a) {
			if (!b.has(val)) return false;
		}
		return true;
	}

	if (Array.isArray(a)) {
		if (!Array.isArray(b) || a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!areEqual(a[i], b[i])) return false;
		}
		return true;
	}

	if (typeof a === 'object') {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) return false;
		for (const key of keysA) {
			if (!Object.prototype.hasOwnProperty.call(b, key) || !areEqual(a[key], b[key])) return false;
		}
		return true;
	}

	return false;
}

export function flatten(o: any, prefix: string = '', stringify: boolean = false): Record<string, any> {
	const flattened = Object.create(null) as Record<string, any>;
	_flatten(flattened, prefix, o, stringify);
	return flattened;
}

function _flatten(flattened: Record<string, any>, key: string, value: any, stringify: boolean = false) {
	if (Object(value) !== value) {
		if (stringify) {
			if (value == null) {
				flattened[key] = null;
			} else if (typeof value === 'string') {
				flattened[key] = value;
			} else {
				flattened[key] = JSON.stringify(value);
			}
		} else {
			flattened[key] = value;
		}
	} else if (Array.isArray(value)) {
		const len = value.length;
		for (let i = 0; i < len; i++) {
			_flatten(flattened, `${key}[${i}]`, value[i], stringify);
		}
		if (len === 0) {
			flattened[key] = null;
		}
	} else {
		let isEmpty = true;
		for (const p in value) {
			isEmpty = false;
			_flatten(flattened, key ? `${key}.${p}` : p, value[p], stringify);
		}
		if (isEmpty && key) {
			flattened[key] = null;
		}
	}
}

export function paths(o: Record<string, any>, path?: string): string[] {
	const results = [];

	for (const key in o) {
		const child = o[key];
		if (typeof child === 'object') {
			results.push(...paths(child, path === undefined ? key : `${path}.${key}`));
		} else {
			results.push(path === undefined ? key : `${path}.${key}`);
		}
	}

	return results;
}
