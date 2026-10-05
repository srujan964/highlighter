import './overlay.css'
import { TwitchIRCClient } from './twitch/client'
import { Status } from './ui/status'
import { Feed } from './ui/feed'
import {
	extractTargetMsgId,
	filterAndProcess,
	isFromModerator,
	readConfig,
	toChatMessage,
} from './utils'
import { demo } from './demo'
import type { Config } from './types'

const FLASH_INTERVAL_MS: number = 4500

const config: Config =
	window.location.protocol === 'file:'
		? {
				channel: import.meta.env.VITE_CHANNEL,
				feedSize: Number(import.meta.env.VITE_FEED_SIZE),
				size: Number(import.meta.env.VITE_FONT_SIZE),
				interval: Number(import.meta.env.VITE_INTERVAL_MS),
				hideAfter: Number(import.meta.env.VITE_HIDE_AFTER),
				isDemo: import.meta.env.VITE_DEMO_ENABLED === 'true',
			}
		: readConfig(document.location.toString())

const rootStyle = document.documentElement.style
rootStyle.setProperty('--size', `${config.size}px`)

const feed = new Feed(requireElement('feed'), {
	hideAfterMs: config.hideAfter * 60 * 1000,
	flashIntervalMs: config.interval ?? FLASH_INTERVAL_MS,
	maxMessages: config.feedSize,
})
const statusLine = new Status(requireElement('status'))

if (config.isDemo) {
	demo(feed)
} else if (config.channel) {
	listen(config.channel, feed, statusLine)
} else {
	feed.notice(
		'Setup required',
		'Add ?channel=<channelname> to the URL of this source.'
	)
}

function listen(channel: string, feed: Feed, statusline: Status): void {
	const client = new TwitchIRCClient({
		channel,
		prefilter: (line) => isFromModerator(line),
		onStatus: (text) => statusline.displayStatus(text),
		onEvent: (msg) => {
			switch (msg.command) {
				case 'PRIVMSG':
					const msgToHighlight = filterAndProcess(toChatMessage(msg))
					if (msgToHighlight) {
						try {
							feed.show(msgToHighlight)
						} catch (err) {
							console.error('Error showing message', err)
						}
					}
					break
				case 'CLEARMSG':
					const msgIdToDelete = extractTargetMsgId(msg)
					if (msgIdToDelete) feed.remove(msgIdToDelete)
					break
				default:
					console.log(`Prefiltered message lost from switch - ${msg.source}`)
			}
		},
	})

	client.connect()
}

function requireElement(id: string): HTMLElement {
	const element = document.getElementById(id)
	if (!element) throw new Error(`#${id} is missing from index.html`)
	return element
}
