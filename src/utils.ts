import type { Config } from './types'

const DEFAULT_FONT_SIZE = 14
const DEFAULT_INTERVAL = 4500
const DEFAULT_LAYERS = '3'

export function readConfig(url: string): Config {
	const params = new URL(url).searchParams
	const size: number = Number(params.get('size')) ?? DEFAULT_FONT_SIZE
	const interval: number = Number(params.get('interval')) ?? DEFAULT_INTERVAL
	const layers: string = params.get('layers') ?? DEFAULT_LAYERS
	const isDemo: boolean = params.get('demo') === 'true'
	return { size, interval, layers, isDemo }
}
