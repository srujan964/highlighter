import { demo } from './demo'
import './overlay.css'
import { TwitchIRCClient } from './twitch/client'

import { Feed } from './ui/feed'
import { isFromModerator, readConfig, toChatMessage } from './utils'

const FLASH_INTERVAL_MS: number = 4500
const MAX_MESSAGES: number = 5

const config = readConfig(document.location.toString())

const rootStyle = document.documentElement.style
rootStyle.setProperty('--size', `${config.size}px`)

const feed = new Feed(requireElement('feed'), requireElement('status'), {
	hideAfterMs: config.hideAfter * 60 * 1000,
	flashIntervalMs: FLASH_INTERVAL_MS,
	maxMessages: MAX_MESSAGES,
})

if (config.isDemo) {
	demo(feed)
} else if (config.channel) {
	listen(config.channel, feed)
} else {
	feed.notice(
		'Setup required',
		'Add ?channel=<channelname> to the URL of this source.'
	)
}

function listen(channel: string, feed: Feed): void {
	const client = new TwitchIRCClient({
		channel,
		prefilter: (line) => isFromModerator(line),
		onStatus: (text) => feed.displayStatus(text),
		onEvent: (msg) => {
			switch (msg.command) {
				case 'PRIVMSG':
					feed.show(toChatMessage(msg))
					break
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
