export class Status {
	private element: HTMLElement

	constructor(element: HTMLElement) {
		this.element = element
	}

	/**
	 * Display a temporary toast message in the feed.
	 */
	displayStatus(text: string): void {
		if (!this.element) return

		this.element.textContent = text

		this.element.classList.remove('visible')
		void this.element.offsetWidth
		this.element.classList.add('visible')
	}
}
