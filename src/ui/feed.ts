import { Deque } from '../deque'
import type { ChatMessage } from '../types'
import { formatTime } from '../utils'

export interface FeedOptions {
	flashIntervalMs: number
	hideAfterMs: number
	maxMessages: number
}

interface Message {
	readonly element: HTMLElement
	readonly message: ChatMessage | undefined
	evictTimer: number | undefined
}

export class Feed {
	private root: HTMLElement
	private status: HTMLElement | null
	private opts: FeedOptions
	private messageQueue: Deque<Message>
	private elements: WeakMap<Element, Message>

	constructor(
		root: HTMLElement,
		statusElement: HTMLElement | null,
		opts: FeedOptions
	) {
		this.root = root
		this.status = statusElement
		this.opts = opts
		this.messageQueue = new Deque()
		this.elements = new WeakMap()

		root.addEventListener('click', (e) => this.onClick(e))
	}

	/**
	 * Add a simple diagnostic message to the top.
	 */
	notice(title: string, text: string): void {
		const element = this.renderInfo(title, text)
		this.add(
			{
				element: element,
				message: undefined,
				evictTimer: undefined,
			},
			0,
			0
		)
	}

	/**
	 * Add new message to the top and flash for `flashIntervalMs`.
	 */
	show(msg: ChatMessage): void {
		const element = this.render(msg)
		this.add(
			{
				element,
				message: msg,
				evictTimer: undefined,
			},
			this.opts.flashIntervalMs,
			this.opts.hideAfterMs
		)
	}


	/**
	 * Display a temporary toast message in the feed.
	 */
	displayStatus(text: string): void {
		if (!this.status) return

		this.status.textContent = text

		this.status.classList.remove('visible')
		void this.status.offsetWidth
		this.status.classList.add('visible')
	}

	/**
	 * Remove an existing message from the queue.
	 */
	remove(msg: ChatMessage): void {
		const deleted = this.messageQueue.popIf((m) => m.message?.id === msg.id)
		if (deleted) {
			this.dismiss(deleted)
		}
	}

	private onClick(e: MouseEvent): void {
		if (!(e.target instanceof Element)) return
		const element = e.target.closest('.msg')
		const entry = element ? this.elements.get(element) : undefined
		if (entry) this.bringToFront(entry)
	}

	private bringToFront(entry: Message): void {
		if (!this.messageQueue.moveToFront(entry)) return
		window.clearTimeout(entry.evictTimer)
		entry.evictTimer = undefined
		this.layout()
	}

	private add(entry: Message, fadeAfter: number, evictAfter: number): void {
		this.elements.set(entry.element, entry)
		this.messageQueue.pushFront(entry)
		this.root.append(entry.element)
		if (fadeAfter > 0) {
			setTimeout(() => {
				this.deemphasize(entry)
			}, fadeAfter)
		}

		if (evictAfter > 0) {
			entry.evictTimer = setTimeout(() => {
				this.dismiss(entry)
			}, evictAfter)
		}

		if (this.messageQueue.size() > this.opts.maxMessages) {
			const oldest = this.messageQueue.popBack()!
			this.dismiss(oldest)
			this.layout()
		}
	}

	private layout(): void {
		;[...this.messageQueue].forEach((msg: Message, depth: number) => {
			msg.element.classList.toggle('front', depth === 0)
			msg.element.style.setProperty('--depth', String(depth))
		})
	}

	// Remove the strobe/flash styling on the message
	private deemphasize(msg: Message): void {
		msg.element.classList.remove('emphasis')
	}

	private dismiss(msg: Message): void {
		window.clearTimeout(msg.evictTimer)
		this.elements.delete(msg.element)
		msg.element.remove()
	}

	private renderInfo(title: string, text: string): HTMLElement {
		const element = document.createElement('div')
		element.classList.add('msg')

		const tab = document.createElement('div')
		tab.className = 'tab'
		tab.textContent = title

		const body = document.createElement('div')
		body.className = 'body'
		body.textContent = text

		element.append(tab, body)
		return element
	}

	private render(msg: ChatMessage): HTMLElement {
		const element = document.createElement('div')
		element.classList.add('msg')
		element.classList.add('emphasis')

		if (msg.color) element.style.setProperty('--user-color', msg.color)

		const tab = document.createElement('div')
		tab.className = 'tab'
		tab.textContent = msg.name

		const body = document.createElement('div')
		body.className = 'body'
		body.textContent = msg.text

		const timestamp = document.createElement('div')
		timestamp.className = 'time'
		timestamp.textContent = formatTime(msg.timestamp)

		element.append(tab, body, timestamp)
		return element
	}
}
