export interface Config {
	channel: string | null
	feedSize: number
	size: number
	interval: number
	hideAfter: number
	isDemo: boolean
}

export interface ChatMessage {
	id?: string
	name: string
	color: string
	text: string
	timestamp: number
}

export type Tag = Readonly<Record<string, string>>

export interface IRCMessage {
	tags: Tag
	source: string
	command: string
	params: string[]
	trailing: string | null
}
