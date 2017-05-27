import { MyStorage } from 'common/commons';
import { Observable } from 'base/observable';
export interface BasePanelEvent {
	"changeTitle": string;
	"hoge": number;
};
export type PanelType = "board" | "sureList" | "resList" | "form";

export abstract class Panel<T = BasePanelEvent, S = {}> extends Observable<T & BasePanelEvent> {
	protected _el: Element;
	protected _title: string;
	protected readonly _storage: S;

	public abstract get panelType(): PanelType;
	public get el() { return this._el; }
	public get title(): string { return this._title; }
	constructor() {
		super();
		this._title = "";
		this._storage = this.getSavedStorage();
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
}