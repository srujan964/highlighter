/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
	plugins: [viteSingleFile()],
	build: { modulePreload: { polyfill: false } },
	test: {
		environment: 'happy-dom',
		reporters: ['tree'],
		silent: 'passed-only',
	},
})
