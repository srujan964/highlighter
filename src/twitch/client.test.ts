import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TwitchIRCClient, type Socket, type SocketFactory } from './client'
import type { IRCMessage } from '../types'

class FakeSocket implements Socket {
	onopen: Socket['onopen'] = null
	onmessage: Socket['onmessage'] = null
	onclose: Socket['onclose'] = null
	readonly url: string
	readonly sent: string[] = []
	closed = false

	constructor(url: string) {
		this.url = url
	}

	send(data: string): void {
		this.sent.push(data)
	}

	close(): void {
		this.closed = true
	}

	open(): void {
		this.onopen?.(new Event('open'))
	}

	receive(...lines: string[]): void {
		this.onmessage?.(
			new MessageEvent('message', {
				data: lines.map((l) => `${l}\r\n`).join(''),
			})
		)
	}

	drop(): void {
		this.onclose?.(new Event('close') as CloseEvent)
	}
}

let sockets: FakeSocket[] = []
const socketFactory: SocketFactory = (url: string) => {
	const s = new FakeSocket(url)
	sockets.push(s)
	return s
}

interface Harness {
	client: TwitchIRCClient
	events: IRCMessage[]
	statuses: string[]
	prefilterInvocations: string[]
}

function setup(custom: Partial<Harness> = {}): Harness {
	const events: IRCMessage[] = []
	const statuses: string[] = []
	const prefilterInvocations: string[] = []
	const client = new TwitchIRCClient(
		{
			channel: 'testchannel',
			prefilter: (line: string) => {
				prefilterInvocations.push(line)
				return line.includes('moderator/1')
			},
			onEvent: (m) => events.push(m),
			onStatus: (s) => statuses.push(s),
			...custom,
		},
		socketFactory
	)

	return { client, events, statuses, prefilterInvocations }
}

function start(custom: Partial<Harness> = {}): Harness & { sock: FakeSocket } {
	const harness = setup(custom)
	harness.client.connect()
	const sock = sockets[0]
	sock.open()
	return { ...harness, sock }
}

const last = <T,>(l: T[]): T | undefined => l[l.length - 1]

beforeEach(() => {
	vi.useFakeTimers()
	sockets = []
})

afterEach(() => {
	vi.useRealTimers()
})

describe('IRC client connection handling', () => {
	it('should initialize client', () => {
		const { client, statuses } = setup()
		client.connect()
		expect(sockets).toHaveLength(1)
		expect(sockets[0]?.url).toBe('wss://irc-ws.chat.twitch.tv:443')
		expect(sockets[0]?.sent).toEqual([])
		expect(statuses).toEqual(['Connecting...'])
	})

	it('should send connection messages to IRC server', () => {
		const { sock } = start()

		expect(sock.sent).toEqual([
			'CAP REQ :twitch.tv/tags twitch.tv/commands',
			'PASS deadbeef',
			expect.stringMatching(/^NICK justinfan\d+$/),
			'JOIN #testchannel',
		])
	})

	it('should ignore subsequent connect() if already connected', () => {
		const { client } = setup()
		client.connect()
		client.connect()
		expect(sockets).toHaveLength(1)
	})
})

describe('IRC client message handling', () => {
	it('should reply to PING with PONG', () => {
		const { sock } = start()
		sock.receive('PING :tmi.twitch.tv')
		expect(last(sock.sent)).toBe('PONG :tmi.twitch.tv')
	})

	it('should handle multiple messages sent in a single frame', () => {
		const { sock, events } = start()
		sock.receive(
			`:tmi.twitch.tv 001 <user> :Welcome, GLHF!`,
			`:tmi.twitch.tv 002 <user> :Your host is tmi.twitch.tv`,
			`:tmi.twitch.tv 003 <user> :This server is rather new`,
			`:tmi.twitch.tv 004 <user> :-`,
			`:tmi.twitch.tv 375 <user> :-`,
			`:tmi.twitch.tv 372 <user> :You are in a maze of twisty passages, all alike.`,
			`:tmi.twitch.tv 376 <user> :>`,
			`@badge-info=;badges=;color=;display-name=<user>;emote-sets=0,300374282;user-id=12345678;user-type= :tmi.twitch.tv GLOBALUSERSTATE`,
			`PING :tmi.twitch.tv`,
			`@badge-info=;badges=moderator/1;color=#0000FF;display-name=foofoo;emotes=62835:0-10;first-msg=0;flags=;id=f80a19d6-e35a-4273-82d0-cd87f614e767;mod=1;room-id=713936733;subscriber=1;tmi-sent-ts=1642696567751;turbo=0;user-id=713936733;user-type= :foofoo!foofoo@foofoo.tmi.twitch.tv PRIVMSG #bar :bleedPurple`,
			`@login=ronni;room-id=;target-msg-id=abc-123-def;tmi-sent-ts=1642720582342 :tmi.twitch.tv CLEARMSG #dallas :bleedPurple`
		)

		expect(events.map((m) => m.command)).toEqual(['PRIVMSG', 'CLEARMSG'])
		expect(last(sock.sent)).toBe('PONG :tmi.twitch.tv')
	})

	it('should report authentication notices', () => {
		const { sock, statuses } = start()
		sock.receive(':tmi.twitch.tv NOTICE #testchannel :login unsuccessful')
		expect(last(statuses)).toBe('notice: login unsuccessful')
	})
})

describe('Client reconnection and retries', () => {
	const dropAndRetry = (harness: Harness, ms: number) => {
		last(sockets)!.drop()
		const status = last(harness.statuses)
		vi.advanceTimersByTime(ms)
		return status
	}

	it('should reconnect with an exponential backoff', () => {
		const harness = setup()
		harness.client.connect()
		expect(dropAndRetry(harness, 1000)).toBe('Disconnected. Retrying in 1s...')
		expect(dropAndRetry(harness, 2000)).toBe('Disconnected. Retrying in 2s...')
		expect(dropAndRetry(harness, 4000)).toBe('Disconnected. Retrying in 4s...')
		expect(sockets).toHaveLength(4)
	})

	it('should ignore anything done by an abandoned socket', () => {
		const harness = setup()
		harness.client.connect()
		const old = sockets[0]
		old.open()
		old.receive(':tmi.twitch.tv RECONNECT')
		old.receive(
			`@badge-info=;badges=moderator/1,subscriber/12;color=#1E90FF:ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #dallas :Hello, chat!`
		)

		old.drop()

		expect(harness.events).toEqual([])
		expect(vi.getTimerCount()).toBe(2)
		vi.advanceTimersByTime(1000)
		expect(sockets).toHaveLength(2)
	})
})

describe('Client shutdown', () => {
	it('close() should shut down the socket, stop timers, and never reconnect', () => {
		const harness = setup()
		harness.client.connect()
		sockets[0].drop()
		harness.client.close()
		expect(vi.getTimerCount()).toBe(0)
		vi.advanceTimersByTime(60000)
		expect(sockets).toHaveLength(1)
	})

	it('should give up when Twitch refuses requested capabilities', () => {
		const { sock, statuses } = start()
		sock.receive('CAP * NAK :twitch.tv/tags')
		expect(last(statuses)).toBe(
			'Twitch refused the capabilities required for this to function: twitch.tv/tags'
		)
	})

})
