// const IRC_URL: string = 'wss://irc-ws.chat.twitch.tv:443'

// const BACKOFF_MS: number = 1000
// const MAX_BACKOFF_MS: number = 30000

export interface ClientOptions {
	channel: string
	prefilter: (line: string) => boolean
	onEvent: (msg: any) => void
	onStatus: (status: string) => void
}

export interface Socket {
	onopen: ((ev: Event) => void) | null
	
}

export class TwitchIRCClient {
	// private readonly opts: ClientOptions

	constructor() {
		// this.opts = opts
	}
}
