import { BaseComponent, ComponentOption } from './baseComponent';
export interface SearchTextOption extends ComponentOption {
	width: number;
	placeholder?: string;
	onChange: (text: string) => void;
}

export class SearchText extends BaseComponent<SearchTextOption> {
	private _oldValue: string;
	private _timer: number;
	/** @override */
	public html() {
		return `
		<div 
			class="my-search-text-component ${super.getClassNames()}"
			style="width:${this.option!.width}px"
			${super.htmlAttr()}
		>
			<input type="text" placeholder="${this.option!.placeholder || "検索"}" />
		</div>
		`;
	}
	/** @override */
	public initElem(elem: HTMLElement, option: SearchTextOption) {
		const input = <HTMLInputElement>elem.querySelector("input");
		input.addEventListener("keyup", () => {
			const newValue = input.value;
			window.clearTimeout(this._timer);
			this._timer = window.setTimeout(() => {
				if (newValue !== this._oldValue) {
					this._oldValue = newValue;
					option.onChange(newValue);
					this._timer = new Date().getTime();
				}
			}, 300);
		});
	}
}