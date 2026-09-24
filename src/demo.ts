import { Feed } from './ui/feed'

export function demo(feed: Feed) {
	const ts = Date.now()
	feed.show({
		id: 'msg-id-1',
		name: 'john',
		color: '#9857d4',
		text: 'VoHiYo',
		timestamp: ts,
	})
	feed.show({
		id: 'msg-id-2',
		name: 'jane',
		color: '#9857d4',
		text: 'Kappa',
		timestamp: ts,
	})
	feed.show({
		id: 'msg-id-3',
		name: 'alice',
		color: '#9857d4',
		text: 'HeyGuys',
		timestamp: ts,
	})
	feed.show({
		id: 'msg-id-4',
		name: 'bob',
		color: '#9857d4',
		text: 'MrDestructoid',
		timestamp: ts,
	})
	feed.show({
		id: 'msg-id-5',
		name: 'charlie',
		color: '#9857d4',
		text: 'PersonalBest',
		timestamp: ts,
	})
	feed.show({
		id: 'msg-id-6',
		name: 'enid',
		color: '#9857d4',
		text: 'FalDamage',
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
