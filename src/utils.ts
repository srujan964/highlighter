import { checkTags } from './twitch/parser'
import type { ChatMessage, Config, IRCMessage } from './types'

const DEFAULT_FONT_SIZE = 14
const DEFAULT_INTERVAL = 4500
const DEFAULT_HIDE_AFTER = 10
const DEFAULT_MAX_MSGS = 5

const TAG_MOD = 'mod'
const TAG_MSG_TIMESTAMP = 'tmi-sent-ts'
const TAG_VALUE_TRUE = '1'

export const FILTER_TERMS = ['!ht', '!highlight', 'ht:']

export function readConfig(url: string): Config {
	const params = new URL(url).searchParams
	const channel = params.get('channel')
	const size: number = Number(params.get('size')) ?? DEFAULT_FONT_SIZE
	const interval: number = Number(params.get('interval')) ?? DEFAULT_INTERVAL
	const hideAfter: number =
		Number(params.get('hideAfter')) ?? DEFAULT_HIDE_AFTER
	const feedSize: number = Number(params.get('feedSize')) ?? DEFAULT_MAX_MSGS
	const isDemo: boolean = params.get('demo') === 'true'
	return { channel, size, feedSize, interval, hideAfter, isDemo }
}

export function toChatMessage(msg: IRCMessage): ChatMessage {
	return {
		id: msg.tags['id'],
		name: msg.tags['display-name'],
		color: msg.tags['color'] ?? '#FF7E26',
		text: msg.trailing ?? 'nothing to read here',
		timestamp: parseTimestamp(msg.tags[TAG_MSG_TIMESTAMP]),
	}
}

export function isFromModerator(line: string): boolean {
	return checkTags(line, TAG_MOD, TAG_VALUE_TRUE)
}

export function formatTime(unixTm: number): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(unixTm))
}

export function filterAndProcess(msg: ChatMessage): ChatMessage | null {
	const text = msg.text.trim()
	const match = FILTER_TERMS.find((term) => text.startsWith(term))
	if (!match || text === match) {
		return null
	}
	let contents = text.slice(match.length)

	// Check for presence of a custom highlight duration for `ht:`
	// "ht:20 Hello!" is valid, but "ht:20 " is not.
	if (match === 'ht:' && !contents.startsWith(' ')) {
		const firstSpace = contents.indexOf(' ')
		if (firstSpace === -1) return null
		const [val, rest] = [
			contents.slice(0, firstSpace),
			contents.slice(firstSpace + 1),
		]

		const nonNumeric = Array.from(val!).some(
			(c: string) => c.charCodeAt(0) < 48 || c.charCodeAt(0) > 57
		)
		if (nonNumeric) return null

		const duration = parseInt(val!, 10)
		if (duration < 1 || duration >= 60) {
			return {
				...msg,
				text: rest,
			}
		}

		return {
			...msg,
			text: rest,
			durationMs: duration * 1000 * 60,
		}
	}

	return {
		...msg,
		text: contents.trimStart(),
	}
}

export function extractTargetMsgId(deleteMessage: IRCMessage): string {
	return deleteMessage.tags['target-msg-id'] ?? null
}

const isHttps: (text: string) => boolean = (text) => /^https:\/\//i.test(text)

export function isLink(text: string): boolean {
	const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(text)
	if (hasProtocol && !isHttps(text)) return false

	try {
		const url = new URL(normalizeLink(text))
		const parts = url.hostname.split('.')
		if (parts.length < 2) {
			return false
		}

		const validParts = parts.every((part) => part.length > 0)

		const tld = parts[parts.length - 1]
		if (/^[0-9]+/i.test(tld)) {
			return false
		}

		return url.protocol === 'https:' && validParts
	} catch {
		return false
	}
}

export function normalizeLink(link: string) {
	return isHttps(link) ? link : `https://${link}`
}

function parseTimestamp(raw: string | null): number {
	const value = raw === undefined ? NaN : Number(raw)
	return Number.isFinite(value) ? value : Date.now()
}
