import { Deque } from '../deque'
import type { ChatMessage } from '../types'

export interface FeedOptions {
	flashIntervalMs: number
	maxMessages: number
}

interface Message {
	readonly element: HTMLElement
	readonly id: string | undefined
	readonly username: string | undefined
	timer: number | undefined
}

export class Feed {
	private root: HTMLElement
	private opts: FeedOptions
	private messages: Deque<Message>

	constructor(root: HTMLElement, opts: FeedOptions) {
		this.root = root
		this.opts = opts
		this.messages = new Deque()
	}

	/**
	 * Add a simple diagnostic message to the top.
	 */
	notice(title: string, text: string): void {
		const element = this.render(title, text)
		this.add(
			{
				element: element,
				id: undefined,
				username: undefined,
				timer: undefined,
			},
			0
		)
	}

	/**
	 * Add new message to the top and flash for `flashIntervalMs`.
	 */
	show(msg: ChatMessage): void {
		const element = this.render(msg.name, msg.text)
		this.add(
			{ element, id: msg.id, username: msg.name, timer: undefined },
			this.opts.flashIntervalMs
		)
	}

	/**
	 * Remove an existing message from the queue.
	 */
	remove(msg: ChatMessage): void {
		const deleted = this.messages.popIf((m) => m.id === msg.id)
		if (deleted) {
			this.dismiss(deleted)
		}
	}

	private add(entry: Message, fadeAfter: number): void {
		this.messages.pushFront(entry)
		this.root.append(entry.element)
		if (fadeAfter > 0) {
			entry.timer = setTimeout(() => {
				this.stopEmphasis(entry)
			}, fadeAfter)
		}

		if (this.messages.size() > this.opts.maxMessages) {
			const oldest = this.messages.popBack()!
			this.dismiss(oldest)
			this.layout()
		}
	}

	private layout(): void {
		;[...this.messages].forEach((msg: Message, depth: number) => {
			msg.element.classList.toggle('front', depth === 0)
			msg.element.style.setProperty('--depth', String(depth))
		})
	}

	// Remove the strobe/flash styling on the message
	private stopEmphasis(msg: Message): void {
		msg.element.classList.remove('.emphasis')
	}

	private dismiss(msg: Message): void {
		window.clearTimeout(msg.timer)
		msg.element.remove()
	}

	private render(name: string, text: string): HTMLElement {
		const element = document.createElement('div')
		element.className = 'msg'
		const tab = document.createElement('div')
		tab.className = 'tab'
		tab.textContent = name

		const body = document.createElement('div')
		body.className = 'body'
		body.textContent = text

		element.append(tab, body)
		return element
	}
}
