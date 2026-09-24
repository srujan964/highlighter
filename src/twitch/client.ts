import type { IRCMessage } from '../types'
import { command, parseIRC } from './parser'

const IRC_URL: string = 'wss://irc-ws.chat.twitch.tv:443'
const CHANNEL_NAME = /^[a-z0-9_]{1,25}$/

const SILENCE_MS = 6 * 30000 // 6 minutes atleast

const BASE_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30000

const HEALTHCHECK_INTERVAL_MS = 30000

export interface ClientOptions {
	channel: string
	prefilter: (line: string) => boolean
	onEvent: (msg: IRCMessage) => void
	onStatus: (status: string) => void
}

export interface Socket {
	onopen: ((ev: Event) => void) | null
	onmessage: ((ev: MessageEvent) => void) | null
	onclose: ((ev: CloseEvent) => void) | null
	send(data: string): void
	close(): void
}

function randomInt(max: number): number {
	return Math.floor(Math.random() * max)
}

const AUTH_FAIL_NOTICE =
	/login unsuccessful|login authentication failure|improperly formatted auth/i

export type SocketFactory = (url: string) => Socket

export class TwitchIRCClient {
	private readonly opts: ClientOptions
	private readonly createSocket: SocketFactory

	private stopped = false
	private socket: Socket | null = null
	private reconnectTimer: number | undefined

	private healthcheckTimer: number | undefined = setTimeout(
		() => this.healthcheck(),
		HEALTHCHECK_INTERVAL_MS
	)

	private openedAt = 0
	private retries = 0
	private lastRx = 0

	private nickname = `justinfan${randomInt(10000)}`

	constructor(
		opts: ClientOptions,
		createSocket: SocketFactory = (url) => new WebSocket(url)
	) {
		this.opts = opts
		this.createSocket = createSocket
	}

	connect(): void {
		if (this.socket) return
		if (!CHANNEL_NAME.test(this.opts.channel)) {
			this.opts.onStatus(`invalid channel name. must match ${CHANNEL_NAME}`)
			return
		}

		this.open()
	}

	private open(): void {
		this.notify('Connecting...')
		const sock = this.createSocket(IRC_URL)
		this.socket = sock
		this.openedAt = 0

		sock.onopen = () => {
			this.openedAt = Date.now()
			sock.send('CAP REQ :twitch.tv/tags twitch.tv/commands')
			sock.send('PASS deadbeef')
			sock.send(`NICK ${this.nickname}`)
			sock.send(`JOIN #${this.opts.channel}`)
		}

		sock.onmessage = (e) => {
			this.lastRx = Date.now()
			if (typeof e.data === 'string') this.handleData(e.data)
		}

		sock.onclose = () => {
			if (sock !== this.socket) return
			this.socket = null
			this.scheduleReconnect()
		}
	}

	close(): void {
		this.stopped = true
		clearTimeout(this.reconnectTimer)
		this.reconnectTimer = undefined
		clearTimeout(this.healthcheckTimer)
		this.healthcheckTimer = undefined
		this.leave()
	}

	private handleData(data: string): void {
		for (const line of data.split('\r\n')) {
			if (!line) continue
			try {
				this.onLine(line)
			} catch (err) {
				console.error('overlay: failed to read line from data', err)
			}
		}
	}

	private onLine(line: string): void {
		if (command(line) === 'PRIVMSG' && !this.opts.prefilter(line)) {
			return
		}

		const msg = parseIRC(line)

		switch (msg.command) {
			case 'PRIVMSG':
			case 'CLEARMSG':
			case 'CLEARCHAT':
				this.opts.onEvent(msg)
				break
			case 'PING':
				this.socket?.send(`PONG :${msg.trailing ?? ':tmi.twitch.tv'}`)
				break
			case 'CAP':
				if (msg.params[1] === 'NAK')
					this.bail(
						`Twitch refused the capabilities required for this to function: ${msg.trailing}`
					)
				break
			case '001':
				this.notify('connected :)')
				break
			case 'JOIN':
				if (msg.params[0] === `#${this.opts.channel}`)
					this.notify(`watching #${this.opts.channel}`)
				break
			case 'RECONNECT':
				this.retries = 0
				this.leave()
				this.scheduleReconnect()
				break
			case 'NOTICE':
				const text = msg.trailing ?? ''
				if (AUTH_FAIL_NOTICE.test(text)) this.bail(`notice: ${text}`)
				break
		}
	}

	private healthcheck(): void {
		if (this.socket && Date.now() - this.lastRx > SILENCE_MS) {
			this.notify('No data from twitch, attempting a reconnect')
			this.leave()
			this.scheduleReconnect()
		}
	}

	private scheduleReconnect(): void {
		if (this.stopped || this.reconnectTimer !== undefined) return

		if (this.openedAt > 0 && Date.now() - this.openedAt > SILENCE_MS)
			this.retries = 0

		const delay = Math.min(MAX_BACKOFF_MS, 2 ** this.retries * BASE_BACKOFF_MS)
		this.retries++
		this.notify(`Disconnected. Retrying in ${Math.round(delay / 1000)}s...`)
		this.reconnectTimer = window.setTimeout(() => {
			this.reconnectTimer = undefined
			this.open()
		}, delay)
	}

	private notify(statusLine: string): void {
		this.opts.onStatus(statusLine)
	}

	private bail(reason: string): void {
		this.notify(reason)
		this.close()
	}

	private leave(): void {
		const sock = this.socket
		if (!sock) return
		this.socket = null
		sock.onopen = sock.onmessage = sock.onclose = null
		try {
			sock.close()
		} catch {}
	}
}
