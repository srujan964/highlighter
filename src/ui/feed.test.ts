import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Feed } from './feed'

let root: HTMLElement

beforeEach(() => {
	vi.useFakeTimers()
	document.body.innerHTML = '<div id="feed"></div><div id="status"></div>'
	root = document.getElementById('feed')!
})
afterEach(() => vi.useRealTimers())

const depth = (e: HTMLElement) => Number(e.style.getPropertyValue('--depth'))
const textOf = (e: HTMLElement) => e.querySelector('.body')?.textContent
const deck = () => root.querySelectorAll<HTMLElement>('.msg')
const sorted = () =>
	[...deck()].sort((a: HTMLElement, b: HTMLElement) => depth(a) - depth(b))

describe('basic feed operations', () => {
	const ts = Date.now()
	it('should add message to the top', () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			hideAfterMs: 10000,
			flashIntervalMs: 10000,
		})

		feed.show({
			id: 'msg-id',
			name: 'john',
			color: '#9857d4',
			text: 'VoHiYo',
			timestamp: ts,
		})

		expect(root.querySelector('.tab')?.textContent).toBe('john')
		expect(root.querySelector('.body')?.textContent).toBe('VoHiYo')
	})

	it('should remove existing message from the back', () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			hideAfterMs: 10000,
			flashIntervalMs: 10000,
		})

		feed.show({
			id: 'msg-id-1',
			name: 'john',
			color: '#9857d4',
			text: 'VoHiYo',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-2',
			name: 'jane',
			color: '#9857d4',
			text: 'Kappa',
			timestamp: ts,
		})


		feed.remove(
			'msg-id-1',
		)

		const messages = [...deck()]
		expect(
			messages.map((e: HTMLElement) => e.querySelector('.tab')?.textContent)
		).toEqual(['jane'])
	})

	it(`should preserve no more than 'maxMessages' message entries`, () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			hideAfterMs: 10000,
			flashIntervalMs: 10000,
		})

		feed.show({
			id: 'msg-id-1',
			name: 'john',
			color: '#9857d4',
			text: 'VoHiYo',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-2',
			name: 'jane',
			color: '#9857d4',
			text: 'Kappa',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-3',
			name: 'alice',
			color: '#9857d4',
			text: 'HeyGuys',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-4',
			name: 'bob',
			color: '#9857d4',
			text: 'MrDestructoid',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-5',
			name: 'charlie',
			color: '#9857d4',
			text: 'PersonalBest',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-6',
			name: 'enid',
			color: '#9857d4',
			text: 'FallDamage',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-7',
			name: 'fred',
			color: '#9857d4',
			text: 'GriddyGoose',
			timestamp: ts,
		})

		const msgElements = root.querySelectorAll<HTMLElement>('.msg')
		const users = [...msgElements]
			.sort((a, b) => depth(a) - depth(b))
			.map((e: HTMLElement) => e.querySelector('.tab')?.textContent)

		expect(users).toEqual(['fred', 'enid', 'charlie', 'bob', 'alice'])
	})

	it('should move card to the front if clicked on', () => {
		const feed = new Feed(root, {
			maxMessages: 5,
			hideAfterMs: 10000,
			flashIntervalMs: 10000,
		})

		feed.show({
			id: 'msg-id-1',
			name: 'john',
			color: '#9857d4',
			text: 'VoHiYo',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-2',
			name: 'jane',
			color: '#9857d4',
			text: 'Kappa',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-3',
			name: 'alice',
			color: '#9857d4',
			text: 'HeyGuys',
			timestamp: ts,
		})
		feed.show({
			id: 'msg-id-4',
			name: 'bob',
			color: '#9857d4',
			text: 'MrDestructoid',
			timestamp: ts,
		})

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
