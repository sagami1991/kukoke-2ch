import { ComponentScanner } from './scanner';

export interface ComponentOption {
	readonly className?: string;
}
export abstract class BaseComponent<T extends ComponentOption = ComponentOption, S extends Element = Element> {
	public readonly _id: number;
	private _argClassName: string | undefined;
	private _option: T | null;
	private _elem: S;
	/** initElement後はnullになる */
	protected get option() {
		return this._option;
	}
	protected get elem() {
		return this._elem;
	}
	constructor(option: T) {
		this._option = option;
		this._argClassName = option.className;
		this._id = ComponentScanner.register(this, option);
	}
	public abstract html(): string;
	public preInitElem(elem: S) {
		this._option = null;
		this._elem = elem;
	}
	public abstract initElem(elem: S, option: T): void;
	protected getClassNames(): string {
		return `my-component ${this._argClassName || ""}`;
	}
	protected htmlAttr(): string {
		return `component-id="${this._id}" `;
	}
}