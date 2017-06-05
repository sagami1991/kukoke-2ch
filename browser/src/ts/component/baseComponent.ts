import { Observable } from '../base/observable';
import { ComponentScanner } from './scanner';

export interface ComponentOption {
	readonly className?: string;
}

export abstract class BaseComponent<T extends ComponentOption = ComponentOption, T2 = {}> extends Observable<T2> {
	public readonly _id: number;
	private _argClassName: string | undefined;
	private _option: T | null;
	/** initElement後はnullになる */
	protected get option() {
		return this._option;
	}
	constructor(option: T) {
		super();
		this._option = option;
		this._argClassName = option.className;
		this._id = ComponentScanner.register(this, option);
	}
	public abstract html(): string;
	public preInitElem() {
		this._option = null;
	}
	public abstract initElem(elem: HTMLElement, option: T): void;
	protected getClassNames(): string {
		return `my-component ${this._argClassName || ""}`;
	}
	protected htmlAttr(): string {
		return `component-id="${this._id}" `;
	}
}