import { Feed } from './ui/feed'

export function demo(feed: Feed) {
	const ts = Date.now()
	feed.show({
		id: 'msg-id-6',
		name: 'enid',
		color: '#9857d4',
		text: 'FallDamage',
		timestamp: ts,
	})
	feed.show({
		id: 'msg-id-7',
		name: 'fred',
		color: '#9857d4',
		text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.',
		timestamp: ts,
	})
}
