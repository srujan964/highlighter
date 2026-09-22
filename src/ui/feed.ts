import { Deque } from '../deque'
import type { ChatMessage } from '../types'

export interface FeedOptions {
	flashIntervalMs: number
	maxMessages: number
}

interface Message {
	readonly element: HTMLElement
	readonly message: ChatMessage | undefined
	timer: number | undefined
}

export class Feed {
	private root: HTMLElement
	private opts: FeedOptions
	private messageQueue: Deque<Message>
	private elements: WeakMap<Element, Message>

	constructor(root: HTMLElement, opts: FeedOptions) {
		this.root = root
		this.opts = opts
		this.messageQueue = new Deque()
		this.elements = new WeakMap()

		root.addEventListener('click', (e) => this.onClick(e))
	}

	/**
	 * Add a simple diagnostic message to the top.
	 */
	notice(title: string, text: string): void {
		const element = this.render(title, '', text)
		this.add(
			{
				element: element,
				message: undefined,
				timer: undefined,
			},
			0
		)
	}

	/**
	 * Add new message to the top and flash for `flashIntervalMs`.
	 */
	show(msg: ChatMessage): void {
		const element = this.render(msg.name, msg.color, msg.text)
		this.add(
			{
				element,
				message: msg,
				timer: undefined,
			},
			this.opts.flashIntervalMs
		)
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
		window.clearTimeout(entry.timer)
		entry.timer = undefined
		this.layout()
	}

	private add(entry: Message, fadeAfter: number): void {
		this.elements.set(entry.element, entry)
		this.messageQueue.pushFront(entry)
		this.root.append(entry.element)
		if (fadeAfter > 0) {
			entry.timer = setTimeout(() => {
				this.deemphasize(entry)
			}, fadeAfter)
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
		window.clearTimeout(msg.timer)
		msg.element.remove()
		this.elements.delete(msg.element)
	}

	private render(username: string, color: string, text: string): HTMLElement {
		const element = document.createElement('div')
		element.classList.add('msg')
		element.classList.add('emphasis')

		if (color) element.style.setProperty('--user-color', color)

		const tab = document.createElement('div')
		tab.className = 'tab'
		tab.textContent = username

		const body = document.createElement('div')
		body.className = 'body'
		body.textContent = text

		element.append(tab, body)
		return element
	}
}
