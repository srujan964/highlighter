import { describe, expect, it } from 'vitest'
import { readConfig } from './utils'
import type { Config } from './types'

describe('utils', () => {
	it('should read config from url', () => {
		const url = new URL(
			'http://localhost:80/?channel=testchannel&size=14&interval=4500&hideAfter=5'
		)

		const config: Config = readConfig(url.toString())

		expect(config.channel).toBe('testchannel')
		expect(config.size).toBe(14)
		expect(config.interval).toBe(4500)
		expect(config.hideAfter).toBe(5)
		expect(config.isDemo).toBe(false)
	})
})
