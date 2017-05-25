
class StatusBarView {
	private readonly _el: Element;
	private readonly _msg: HTMLElement;
	private template() {
		return `
		<div class="status-bar-message">
		</div>
		`;
	}

	constructor() {
		this._el = document.querySelector(".status-bar-container")!;
		this._el.innerHTML = this.template();
		this._msg = <HTMLElement> this._el.querySelector(".status-bar-message")!;
	}

	public message(msg: string) {
		this._msg.textContent = msg;
	}
}

export const statusBar = new StatusBarView();