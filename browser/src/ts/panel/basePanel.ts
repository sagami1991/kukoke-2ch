import { createObserverId } from '../base/observable';
import { MyStorage } from 'common/commons';
import { Observable } from 'base/observable';
export interface IBasePanelEvent {
	"changeTitle": string;
	"hoge": number;
};
export type PanelType = "board" | "sureList" | "resList" | "form" | "image";

export abstract class Panel<T = IBasePanelEvent, S = {}> extends Observable<T & IBasePanelEvent> {
	protected _el: Element;
	protected _title: string;
	protected readonly storage: S;
	protected readonly ovserverId: string;

	public abstract get panelType(): PanelType;
	public get el() { return this._el; }
	public get title(): string { return this._title; }
	constructor() {
		super();
		this._title = "";
		this.storage = this.getSavedStorage();
		this.ovserverId = createObserverId();
	}

	protected abstract getStorageForSave(): S;
	protected abstract getDefaultStorage(): S;

	private getSavedStorage() {
		const storage = MyStorage.get(this.panelType, "storage");
		return Object.assign(this.getDefaultStorage(), storage);
	}
	public saveStorage() {
		MyStorage.save(this.panelType, "storage", this.getStorageForSave());
	}

	public canClose() {
		return false;
	}
}