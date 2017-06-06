import { BaseComponent, ComponentOption, ComponentGenerics } from './baseComponent';
export interface TextareaOption extends ComponentOption {
	initValue?: string;
}

interface TextareaGenerics extends ComponentGenerics {
	option: TextareaOption;
	element: HTMLTextAreaElement;
}

export class Textarea extends BaseComponent<TextareaGenerics> {
	/** @override */
	public html() {
		return `
			<textarea 
				class="my-radio-component ${super.getClassNames()}"
				${super.htmlAttr()}
			>
			</textarea>
		`;
	}

	/** @override */
	public initElem(element: HTMLTextAreaElement, option: TextareaOption) {
		element.value = option.initValue || "";
	}

	public setValue(value: string) {
		this.element.value = value;
	}

	public getValue() {
		return this.element.value;
	}
}