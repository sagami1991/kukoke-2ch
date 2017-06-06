import { BaseComponent, ComponentOption, ComponentGenerics } from './baseComponent';
export interface TextOption extends ComponentOption {
	value: string;
}
interface TextGenerics extends ComponentGenerics {
	option: TextOption;
	element: HTMLInputElement;
}

export class Text extends BaseComponent<TextGenerics> {
	/** @override */
	public html() {
		return `
		<div 
			class="text-component ${super.getClassNames()}"
			${super.htmlAttr()}
		>
			<input type="text"/>
		</div>
		`;
	}

	/** @override */
	public initElem(elem: HTMLElement, option: TextOption) {
		const input = <HTMLInputElement>elem.querySelector("input");
		input.value = option.value;
	}
}