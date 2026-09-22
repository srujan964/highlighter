import './overlay.css'

import { Feed } from './ui/feed'
import { readConfig } from './utils'

const config = readConfig(document.location.toString())

const rootStyle = document.documentElement.style
rootStyle.setProperty('--size', `${config.size}px`)

const feed = new Feed(requireElement('feed'), {
	flashIntervalMs: 4500,
	maxMessages: 5,
})

if (config.isDemo) {
	demo(feed)
} else {
	feed.notice(
		'Setup required',
		'Add ?channel=<channelname> to the URL of this source.'
	)
}

function requireElement(id: string): HTMLElement {
	const element = document.getElementById(id)
	if (!element) throw new Error(`#${id} is missing from index.html`)
	return element
}

function demo(feed: Feed) {
	feed.show({ id: 'msg-id-1', name: 'john', color: '#9857d4', text: 'VoHiYo' })
	feed.show({ id: 'msg-id-2', name: 'jane', color: '#9857d4', text: 'Kappa' })
	feed.show({
		id: 'msg-id-3',
		name: 'alice',
		color: '#9857d4',
		text: 'HeyGuys',
	})
	feed.show({
		id: 'msg-id-4',
		name: 'bob',
		color: '#9857d4',
		text: 'MrDestructoid',
	})
	feed.show({
		id: 'msg-id-5',
		name: 'charlie',
		color: '#9857d4',
		text: 'PersonalBest',
	})
	feed.show({
		id: 'msg-id-6',
		name: 'enid',
		color: '#9857d4',
		text: 'FallDamage',
	})
	feed.show({
		id: 'msg-id-7',
		name: 'fred',
		color: '#9857d4',
		text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.',
	})
}
