import { createObserverId } from '../base/observable';
import { MyStorage } from 'common/commons';
import { Observable } from 'base/observable';
export interface BasePanelEvent {
	"changeTitle": string;
	"hoge": number;
};
export type PanelType = "board" | "sureList" | "resList" | "form" | "image";

export abstract class Panel<T = BasePanelEvent, S = {}> extends Observable<T & BasePanelEvent> {
	protected _el: Element;
	protected _title: string;
	protected readonly storage: S;
	protected readonly ovserverId: string;
	private lockCount: number;

	public abstract get panelType(): PanelType;
	public get el() { return this._el; }
	public get title(): string { return this._title; }
	constructor() {
		super();
		this._title = "";
		this.storage = this.getSavedStorage();
		this.ovserverId = createObserverId();
		this.lockCount = 0;
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

	public lock() {
		this._el.classList.add("loading");
		this.lockCount ++;
	}


	public unLock() {
		this.lockCount --;
		if (this.lockCount === 0) {
			this._el.classList.remove("loading");
		}
	}

	public async loadingTransaction(execute: () => Promise<any>) {
		this.lock();
		try {
			await execute();
		} finally {
			this.unLock();
		}
	}

	public canClose() {
		return false;
	}

	public onChangeSize() {
	}
}