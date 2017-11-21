import { BaseComponent, ComponentOption, ComponentGenerics } from './baseComponent';
import { getSvgIcon } from 'common/commons';
import { Button } from 'component/button';
export interface SearchTextOption extends ComponentOption {
	width: number;
	placeholder?: string;
	onChange: (text: string) => void;
}
interface SearchTextGenerics extends ComponentGenerics {
	option: SearchTextOption;
	element: HTMLInputElement;
}
export class SearchText extends BaseComponent<SearchTextGenerics> {
	private _value: string;
	private _timer: number;
	private _input: HTMLInputElement;
	private _onChange: (text: string) => void;

	/** @override */
	public html() {
		return `
		<div 
			class="my-search-text-component ${super.getClassNames()}"
			style="width:${this.option!.width}px"
			${super.htmlAttr()}
		>
			<input type="text" placeholder="${this.option!.placeholder || "検索"}" />
			${new Button({
				style: "icon-only",
				className: "search-reset-button",
				icon: "icon-close",
				iconSize: "s",
				onClick: () => {
					this.empty();
					this._onChange(this._value);
				}
			}).html()}
		</div>
		`;
	}
	/** @override */
	public initElem(elem: HTMLElement, option: SearchTextOption) {
		this._onChange = option.onChange;
		this._input = <HTMLInputElement>elem.querySelector("input");
		this._input.addEventListener("keyup", () => {
			const newValue = this._input.value;
			window.clearTimeout(this._timer);
			this._timer = window.setTimeout(() => {
				if (newValue !== this._value) {
					this._value = newValue;
					option.onChange(this._value);
					this._timer = new Date().getTime();
				}
			}, 300);
		});
	}

	public empty() {
		this._input.value = "";
		this._value = "";
	}

	public getValue() {
		return this._value;
	}
}