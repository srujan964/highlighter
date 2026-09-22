import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Feed } from './feed'

let root: HTMLElement

beforeEach(() => {
	vi.useFakeTimers()
	document.body.innerHTML = '<div id="feed"></div>'
	root = document.getElementById('feed')!
})
afterEach(() => vi.useRealTimers())

const depth = (e: HTMLElement) => Number(e.style.getPropertyValue('--depth'))
const textOf = (e: HTMLElement) => e.querySelector('.body')?.textContent
const deck = () => root.querySelectorAll<HTMLElement>('.msg')
const sorted = () =>
	[...deck()].sort((a: HTMLElement, b: HTMLElement) => depth(a) - depth(b))

describe('basic feed operations', () => {
	it('should add message to the top', () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			flashIntervalMs: 10000,
		})

		feed.show({ id: 'msg-id', name: 'john', text: 'VoHiYo' })

		expect(root.querySelector('.tab')?.textContent).toBe('john')
		expect(root.querySelector('.body')?.textContent).toBe('VoHiYo')
	})

	it('should remove existing message from the back', () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			flashIntervalMs: 10000,
		})

		feed.show({ id: 'msg-id-1', name: 'john', text: 'VoHiYo' })
		feed.show({ id: 'msg-id-2', name: 'jane', text: 'Kappa' })

		feed.remove({ id: 'msg-id-1', name: 'john', text: 'VoHiYo' })

		const messages = [...deck()]
		expect(
			messages.map((e: HTMLElement) => e.querySelector('.tab')?.textContent)
		).toEqual(['jane'])
	})

	it(`should preserve no more than 'maxMessages' message entries`, () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			flashIntervalMs: 10000,
		})

		feed.show({ id: 'msg-id-1', name: 'john', text: 'VoHiYo' })
		feed.show({ id: 'msg-id-2', name: 'jane', text: 'Kappa' })
		feed.show({ id: 'msg-id-3', name: 'alice', text: 'HeyGuys' })
		feed.show({ id: 'msg-id-4', name: 'bob', text: 'MrDestructoid' })
		feed.show({ id: 'msg-id-5', name: 'charlie', text: 'PersonalBest' })
		feed.show({ id: 'msg-id-6', name: 'enid', text: 'FallDamage' })
		feed.show({ id: 'msg-id-7', name: 'fred', text: 'GriddyGoose' })

		const msgElements = root.querySelectorAll<HTMLElement>('.msg')
		const users = [...msgElements]
			.sort((a, b) => depth(a) - depth(b))
			.map((e: HTMLElement) => e.querySelector('.tab')?.textContent)

		expect(users).toEqual(['fred', 'enid', 'charlie', 'bob', 'alice'])
	})

	it('should move card to the front if clicked on', () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			flashIntervalMs: 10000,
		})

		feed.show({ id: 'msg-id-1', name: 'john', text: 'VoHiYo' })
		feed.show({ id: 'msg-id-2', name: 'jane', text: 'Kappa' })
		feed.show({ id: 'msg-id-3', name: 'alice', text: 'HeyGuys' })
		feed.show({ id: 'msg-id-4', name: 'bob', text: 'MrDestructoid' })

		const messages = [...deck()]
		const penultimateEntry = messages.find((e) => textOf(e) === 'Kappa')
		penultimateEntry?.click()
		expect(
			[...sorted()].map(
				(e: HTMLElement) => e.querySelector('.body')?.textContent
			)
		).toStrictEqual(['Kappa', 'MrDestructoid', 'HeyGuys', 'VoHiYo'])
	})
})
