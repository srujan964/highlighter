import { describe, expect, it } from 'vitest'
import { checkTags, command, parseIRC } from './parser'

describe('parse minimal', () => {
	it('should parse regular message', () => {
		const msg = `@badge-info=;badges=;color=;display-name=<user>;emote-sets=0,300374282;user-id=12345678;user-type= :tmi.twitch.tv GLOBALUSERSTATE`

		const ircMessage = parseIRC(msg)

		expect(ircMessage.tags).toStrictEqual({
			'badge-info': '',
			badges: '',
			color: '',
			'display-name': '<user>',
			'emote-sets': '0,300374282',
			'user-id': '12345678',
			'user-type': '',
		})
		expect(ircMessage.source).toBe('tmi.twitch.tv')
		expect(ircMessage.command).toBe('GLOBALUSERSTATE')
	})

	it('should parse message with all components', () => {
		const tags = `@badge-info=;badges=moderator/1,subscriber/12;color=#1E90FF;display-name=Mod\\sOne;emotes=25:0-4;id=abc-123;mod=1;room-id=1;user-id=2`

		const msg =
			tags + ` :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #dallas :Hello, chat!`

		const ircMessage = parseIRC(msg)

		expect(ircMessage).toMatchObject({
			tags: {
				'badge-info': '',
				badges: 'moderator/1,subscriber/12',
				color: '#1E90FF',
				'display-name': 'Mod One',
				emotes: '25:0-4',
				id: 'abc-123',
				mod: '1',
				'room-id': '1',
				'user-id': '2',
			},
			source: 'ronni!ronni@ronni.tmi.twitch.tv',
			command: 'PRIVMSG',
			params: ['#dallas'],
			trailing: 'Hello, chat!',
		})
	})
})

describe('parse command', () => {
	const MESSAGES = [
		`PING :tmi.twitch.tv`,
		`:tmi.twitch.tv RECONNECT`,
		`:ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #dallas :Hello, chat!`,
		`@target-user-id=1 :tmi.twitch.tv CLEARCHAT #dallas :ronni`,
		`@badge-info=;badges=;color=;display-name=<user>;emote-sets=0,300374282;user-id=12345678;user-type= :tmi.twitch.tv GLOBALUSERSTATE`,
	]

	it('should parse just the command', () => {
		expect(command(`PING :tmi.twitch.tv`)).toBe('PING')
		expect(command(`:tmi.twitch.tv RECONNECT`)).toBe('RECONNECT')
		expect(
			command(`:ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #dallas :Hello, chat!`)
		).toBe('PRIVMSG')
		expect(
			command(`@target-user-id=1 :tmi.twitch.tv CLEARCHAT #dallas :ronni`)
		).toBe('CLEARCHAT')
	})

	it('should handle messages containing command strings in them', () => {
		expect(
			command(
				`@target-user-id=4;login=x :tmi.twitch.tv CLEARMSG #dallas :ronni PRIVMSG whoops`
			)
		).toBe('CLEARMSG')
	})

	it(`should be consistent with the command parsed by 'parseIRC'`, () => {
		for (const line of MESSAGES) {
			expect(command(line)).toBe(parseIRC(line).command)
		}
	})
})

describe('raw tag checks', () => {
	it('should check for a given key value pair in tags', () => {
		const tags = `@badge-info=;badges=moderator/1,subscriber/12;color=#1E90FF;mod=1;display-name=Mod\\sOne;emotes=25:0-4;id=abc-123;mod=1;room-id=1;user-id=2`
		const msg =
			tags + ` :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #dallas :Hello, chat!`

		expect(checkTags(msg, 'mod', '1')).toBe(true)
	})

	it('should fail fast if message has no tags', () => {
		const msg = `:ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #dallas :Hello, chat!`

		expect(checkTags(msg, 'mod', '1')).toBe(false)
	})

	it('should return false if the queried key has a different value', () => {
		const nonModTags = `@badge-info=;badges=subscriber/12;color=#1E90FF;mod=0;display-name=ronni;emotes=25:0-4;id=abc-123;mod=1;room-id=1;user-id=2`
		const msg =
			nonModTags +
			` :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #dallas :Hello, chat!`

		expect(checkTags(msg, 'mod', '1')).toBe(false)
	})
})
