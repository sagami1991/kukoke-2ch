import { Observable } from '../base/observable';
import { ComponentScanner } from './scanner';

export interface ComponentOption {
	readonly className?: string;
}
export interface ComponentGenerics {
	option: ComponentOption;
	element: HTMLElement;
	event: {};
}

export abstract class BaseComponent<T extends ComponentGenerics = ComponentGenerics> extends Observable<T["event"]> {
	public readonly _id: number;
	private _argClassName: string | undefined;
	private _option: T["option"] | null;
	private _element: T["element"];
	public get element(): T["element"] {
		return this._element;
	}
	/** initElement後はnullになる */
	protected get option() {
		return this._option;
	}
	constructor(option: T["option"]) {
		super();
		this._option = option;
		this._argClassName = option.className;
		this._id = ComponentScanner.register(this, option);
	}
	public abstract html(): string;
	public preInitElem(element: T["element"]) {
		this._option = null;
		this._element = element;
	}
	public abstract initElem(element: T["element"], option: T["option"]): void;
	protected getClassNames(): string {
		return `my-component ${this._argClassName || ""}`;
	}
	protected htmlAttr(): string {
		return `component-id="${this._id}" `;
	}
}