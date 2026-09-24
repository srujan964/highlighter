import { beforeEach, describe, expect, it } from 'vitest'
import { Status } from './status'

let root: HTMLElement

beforeEach(() => {
	document.body.innerHTML = `<div id="status"></div>`
	root = document.getElementById('status')!
})

describe('statusline', () => {
	it('should set status text', () => {
		const statusline = new Status(root)

		statusline.displayStatus('This is a status')

		expect(root.className).toBe('visible')
		expect(root.textContent).toBe('This is a status')
	})
})
