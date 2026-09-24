import { describe, expect, it } from 'vitest'
import {
	filterAndProcess,
	readConfig,
	FILTER_TERMS,
	extractTargetMsgId,
} from './utils'
import type { ChatMessage, Config, IRCMessage } from './types'

describe('utils', () => {
	it('should read config from url', () => {
		const url = new URL(
			'http://localhost:80/?channel=testchannel&size=14&interval=4500&hideAfter=5'
		)

		const config: Config = readConfig(url.toString())

		expect(config.channel).toBe('testchannel')
		expect(config.size).toBe(14)
		expect(config.interval).toBe(4500)
		expect(config.hideAfter).toBe(5)
		expect(config.isDemo).toBe(false)
	})

	it.for(FILTER_TERMS)(
		'should filter messages containing filter terms and strip them',
		(term) => {
			const text = `${term} VoHiYo`
			const msg: ChatMessage = {
				name: 'john',
				color: '#aaaaaa',
				text: text,
				timestamp: 0,
			}

			const strippedText = text.replace(term, '')

			expect(filterAndProcess(msg)).toMatchObject({
				name: 'john',
				color: '#aaaaaa',
				text: strippedText,
				timestamp: 0,
			})
		}
	)

	it.for(FILTER_TERMS)(
		'should filter out messages that contain only filter terms',
		(term) => {
			const msg: ChatMessage = {
				name: 'john',
				color: '#aaaaaa',
				text: `${term}`,
				timestamp: 0,
			}

			expect(filterAndProcess(msg)).toBe(null)
		}
	)

	it('should return the target msg id from a CLEARMSG message', () => {
		const message: IRCMessage = {
			tags: {
				'target-msg-id': 'target-id',
			},
			source: 'tmi.twitch.tv',
			command: 'CLEARMSG',
			params: [],
			trailing: '',
		}

		expect(extractTargetMsgId(message)).toBe('target-id')
	})

	it('should return null if the message has no target msg id', () => {
		const message: IRCMessage = {
			tags: {},
			source: 'tmi.twitch.tv',
			command: 'CLEARMSG',
			params: [],
			trailing: '',
		}

		expect(extractTargetMsgId(message)).toBeNull()
	})
})
