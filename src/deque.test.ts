import { describe, expect, it } from 'vitest'
import { Deque } from './deque'

describe('Deque tests', () => {
	it('should add entries to the front of the queue', () => {
		const q = new Deque()

		q.pushFront(1)
		q.pushFront(2)
		q.pushFront(3)

		expect([...q]).toStrictEqual([3, 2, 1])
	})

	it('should remove entry from the back of queue', () => {
		const q = new Deque()

		q.pushFront(1)
		q.pushFront(2)
		q.pushFront(3)

		const popped = q.popBack()

		expect(popped).toBe(1)
		expect([...q]).toStrictEqual([3, 2])
	})

	it('should iterate the queue from front to back', () => {
		const q = new Deque()

		q.pushFront(1)
		q.pushFront(2)
		q.pushFront(3)
		q.pushFront(4)

		expect([...q]).toStrictEqual([4, 3, 2, 1])
	})
})
