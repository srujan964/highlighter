export class Deque<T> {
	private array: T[]

	constructor() {
		this.array = []
	}

	size(): number {
		return this.array.length
	}

	clear(): void {
		this.array = new Array()
	}

	pushFront(item: T): void {
		this.array.unshift(item)
	}

	pushBack(item: T): void {
		this.array.push(item)
	}

	popFront(): T | undefined {
		if (this.array.length === 0) return undefined
		const deleted = this.array.splice(0, 1)
		return deleted[0]
	}

	popBack(): T | undefined {
		return this.array.pop()
	}

	moveToFront(item: T): boolean {
		const idx = this.array.indexOf(item)
		if (idx <= 0) return false
		this.array.splice(idx, 1)
		this.array.unshift(item)
		return true
	}

	remove(item: T): boolean {
		const idx = this.array.indexOf(item)
		if (idx === -1) return false
		this.array.splice(idx, 1)
		return true
	}

	popIf(predicate: (value: T) => boolean): T | undefined {
		const idx = this.array.findIndex(predicate)
		if (idx >= 0) {
			return this.removeByIndex(idx)
		}
		return undefined
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.array[Symbol.iterator]()
	}

	private removeByIndex(idx: number): T {
		const deleted = this.array.splice(idx, 1)
		return deleted[0]
	}
}
