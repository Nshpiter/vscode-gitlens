import { Disposable } from 'vscode';

export interface Deferrable<T extends (...args: any[]) => any> {
	(...args: Parameters<T>): ReturnType<T> | undefined;
	cancel(): void;
	flush(): ReturnType<T> | undefined;
	pending?(): boolean;
}

interface PropOfValue {
	(): any;
	value: string | undefined;
}

export interface DebounceOptions {
	leading?: boolean;
	maxWait?: number;
	track?: boolean;
	trailing?: boolean;
}

/**
 * Lightweight debounce implementation (replaces lodash-es _debounce).
 * Supports leading/trailing edges, maxWait, cancel(), and flush().
 */
function _debounce<T extends (...args: any[]) => any>(
	fn: T,
	wait?: number,
	options?: { leading?: boolean; trailing?: boolean; maxWait?: number },
): Deferrable<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let lastArgs: Parameters<T> | undefined;
	let lastThis: any;
	let result: ReturnType<T> | undefined;
	let lastCallTime: number | undefined;
	let lastInvokeTime = 0;

	const leading = options?.leading ?? false;
	const trailing = options?.trailing ?? true;
	const maxWait = options?.maxWait;
	const hasMaxWait = maxWait !== undefined;

	const waitMs = Math.max(wait ?? 0, 0);

	function invoke(time: number): ReturnType<T> | undefined {
		const args = lastArgs;
		const thisArg = lastThis;
		lastArgs = undefined;
		lastThis = undefined;
		lastInvokeTime = time;
		if (args != null) {
			result = fn.apply(thisArg, args);
		}
		return result;
	}

	function startTimer(pendingFunc: () => void, ms: number): ReturnType<typeof setTimeout> {
		return setTimeout(pendingFunc, ms);
	}

	function trailingEdge(time: number): ReturnType<T> | undefined {
		timeoutId = undefined;
		if (trailing && lastArgs != null) {
			return invoke(time);
		}
		lastArgs = undefined;
		lastThis = undefined;
		return result;
	}

	function remainingWait(time: number): number {
		const timeSinceLastCall = time - (lastCallTime ?? 0);
		const timeWaiting = waitMs - timeSinceLastCall;
		if (hasMaxWait) {
			const timeSinceLastInvoke = time - lastInvokeTime;
			return Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
		}
		return timeWaiting;
	}

	function shouldInvoke(time: number): boolean {
		const timeSinceLastCall = time - (lastCallTime ?? 0);
		const timeSinceLastInvoke = time - lastInvokeTime;
		return (
			lastCallTime === undefined ||
			timeSinceLastCall >= waitMs ||
			timeSinceLastCall < 0 ||
			(hasMaxWait && timeSinceLastInvoke >= maxWait)
		);
	}

	function timerExpired(): void {
		const time = Date.now();
		if (shouldInvoke(time)) {
			trailingEdge(time);
			return;
		}
		timeoutId = startTimer(timerExpired, remainingWait(time));
	}

	function leadingEdge(time: number): ReturnType<T> | undefined {
		lastInvokeTime = time;
		timeoutId = startTimer(timerExpired, waitMs);
		return leading ? invoke(time) : result;
	}

	const debounced = function (this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
		const time = Date.now();
		const isInvoking = shouldInvoke(time);

		lastArgs = args;
		lastThis = this;
		lastCallTime = time;

		if (isInvoking) {
			if (timeoutId === undefined) {
				return leadingEdge(time);
			}
			if (hasMaxWait) {
				clearTimeout(timeoutId);
				timeoutId = startTimer(timerExpired, waitMs);
				return invoke(time);
			}
		}
		if (timeoutId === undefined) {
			leadingEdge(time);
		}
		return result;
	} as Deferrable<T>;

	debounced.cancel = function (): void {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
		lastInvokeTime = 0;
		lastArgs = undefined;
		lastCallTime = undefined;
		lastThis = undefined;
		timeoutId = undefined;
	};

	debounced.flush = function (): ReturnType<T> | undefined {
		if (timeoutId === undefined) return result;
		clearTimeout(timeoutId);
		return trailingEdge(Date.now());
	};

	return debounced;
}

function _once<T extends (...args: any[]) => any>(fn: T): T {
	let called = false;
	let result: ReturnType<T>;
	return function (this: any, ...args: any[]) {
		if (!called) {
			called = true;
			result = fn.apply(this, args) as ReturnType<T>;
		}
		return result;
	} as unknown as T;
}

export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	wait?: number,
	options?: DebounceOptions,
): Deferrable<T> {
	const { track, ...opts }: DebounceOptions = {
		track: false,
		...(options ?? {}),
	};

	if (track !== true) return _debounce(fn, wait, opts);

	let pending = false;

	const debounced = _debounce(
		function (this: any, ...args: any[]) {
			pending = false;
			return fn.apply(this, args);
		} as any as T,
		wait,
		options,
	);

	const tracked: Deferrable<T> = function (this: any, ...args: Parameters<T>) {
		pending = true;
		return debounced.apply(this, args);
	} as any;

	tracked.pending = function () {
		return pending;
	};
	tracked.cancel = function () {
		pending = false;
		return debounced.cancel.apply(debounced);
	};
	tracked.flush = function () {
		return debounced.flush.apply(debounced);
	};

	return tracked;
}

// export function debounceMemoized<T extends (...args: any[]) => any>(
// 	fn: T,
// 	wait?: number,
// 	options?: DebounceOptions & { resolver?(...args: any[]): any }
// ): T {
// 	const { resolver, ...opts } = options || ({} as DebounceOptions & { resolver?: T });

// 	const memo = _memoize(() => {
// 		return debounce(fn, wait, opts);
// 	}, resolver);

// 	return function(this: any, ...args: []) {
// 		return memo.apply(this, args).apply(this, args);
// 	} as T;
// }

const comma = ',';
const emptyStr = '';
const equals = '=';
const openBrace = '{';
const openParen = '(';
const closeParen = ')';

const fnBodyRegex = /\(([\s\S]*)\)/;
const fnBodyStripCommentsRegex = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm;
const fnBodyStripParamDefaultValueRegex = /\s?=.*$/;

export function getParameters(fn: Function): string[] {
	if (typeof fn !== 'function') throw new Error('Not supported');

	if (fn.length === 0) return [];

	let fnBody: string = Function.prototype.toString.call(fn);
	fnBody = fnBody.replace(fnBodyStripCommentsRegex, emptyStr) || fnBody;
	fnBody = fnBody.slice(0, fnBody.indexOf(openBrace));

	let open = fnBody.indexOf(openParen);
	let close = fnBody.indexOf(closeParen);

	open = open >= 0 ? open + 1 : 0;
	close = close > 0 ? close : fnBody.indexOf(equals);

	fnBody = fnBody.slice(open, close);
	fnBody = `(${fnBody})`;

	const match = fnBodyRegex.exec(fnBody);
	return match != null
		? match[1].split(comma).map(param => param.trim().replace(fnBodyStripParamDefaultValueRegex, emptyStr))
		: [];
}

export function is<T extends object>(o: T | null | undefined): o is T;
export function is<T extends object>(o: object, prop: keyof T, value?: any): o is T;
export function is<T extends object>(o: object, matcher: (o: object) => boolean): o is T;
export function is<T extends object>(o: object, propOrMatcher?: keyof T | ((o: any) => boolean), value?: any): o is T {
	if (propOrMatcher == null) return o != null;
	if (typeof propOrMatcher === 'function') return propOrMatcher(o);

	return value === undefined ? (o as any)[propOrMatcher] !== undefined : (o as any)[propOrMatcher] === value;
}

export function once<T extends (...args: any[]) => any>(fn: T): T {
	return _once(fn);
}

export function propOf<T, K extends Extract<keyof T, string>>(o: T, key: K) {
	const propOfCore = <T, K extends Extract<keyof T, string>>(o: T, key: K) => {
		const value: string =
			(propOfCore as PropOfValue).value === undefined ? key : `${(propOfCore as PropOfValue).value}.${key}`;
		(propOfCore as PropOfValue).value = value;
		const fn = <Y extends Extract<keyof T[K], string>>(k: Y) => propOfCore(o[key], k);
		return Object.assign(fn, { value: value });
	};
	return propOfCore(o, key);
}

export function disposableInterval(fn: (...args: any[]) => void, ms: number): Disposable {
	let timer: ReturnType<typeof setInterval> | undefined;
	const disposable = {
		dispose: () => {
			if (timer != null) {
				clearInterval(timer);
				timer = undefined;
			}
		},
	};
	timer = setInterval(fn, ms);

	return disposable;
}

/**
 * Szudzik elegant pairing function
 * http://szudzik.com/ElegantPairing.pdf
 */
export function szudzikPairing(x: number, y: number): number {
	return x >= y ? x * x + x + y : x + y * y;
}

export async function wait(ms: number) {
	await new Promise(resolve => setTimeout(resolve, ms));
}
