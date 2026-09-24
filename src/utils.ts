import { checkTags } from './twitch/parser'
import type { ChatMessage, Config, IRCMessage } from './types'

const DEFAULT_FONT_SIZE = 14
const DEFAULT_INTERVAL = 4500
const DEFAULT_HIDE_AFTER = 10

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
	const isDemo: boolean = params.get('demo') === 'true'
	return { channel, size, interval, hideAfter, isDemo }
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
	for (const term of FILTER_TERMS) {
		if (!term) continue
		if (msg.text.startsWith(term) && term !== msg.text)
			return {
				...msg,
				text: msg.text.replace(term, ''),
			}
	}
	return null
}

export function extractTargetMsgId(deleteMessage: IRCMessage): string {
	return deleteMessage.tags['target-msg-id'] ?? null
}

function parseTimestamp(raw: string | null): number {
	const value = raw === undefined ? NaN : Number(raw)
	return Number.isFinite(value) ? value : Date.now()
}
