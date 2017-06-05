import { BaseComponent, ComponentOption } from './baseComponent';
export interface TextareaOption extends ComponentOption {
	initValue?: string;
}

export class Textarea extends BaseComponent<TextareaOption> {
	private element: HTMLTextAreaElement;
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
		this.element = element;
		element.value = option.initValue || "";
	}

	public setValue(value: string) {
		this.element.value = value;
	}

	public getValue() {
		return this.element.value;
	}
}