import { describe, expect, it } from 'vitest'
import { readConfig } from './utils'
import type { Config } from './types'

describe('utils', () => {
	it('should read config from url', () => {
		const url = new URL('http://localhost:80/?size=14&layers=4&interval=4500')

		const config: Config = readConfig(url.toString())

		expect(config.size).toBe(14)
		expect(config.layers).toBe('4')
		expect(config.interval).toBe(4500)
		expect(config.isDemo).toBe(false)
	})
})
