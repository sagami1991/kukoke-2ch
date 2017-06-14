import { notify } from '../common/libs';
import { createObserverId } from '../base/observable';
import { MyStorage } from 'common/commons';
import { Observable } from 'base/observable';
export interface BasePanelEvent {
	"changeTitle": string;
	"hoge": number;
};
export type PanelType = "board" | "sureList" | "resList" | "form" | "image";

export enum KeyCode {
	W = 87
}

export interface TransactionOption {
	finallyExecute?: () => void;
	delayLockKey?: number;
}
export type KeyType = "Alt+W";
export abstract class Panel<T = BasePanelEvent, S = {}> extends Observable<T & BasePanelEvent> {
	public isActive: boolean;
	protected _el: Element;
	protected _title: string;
	protected readonly storage: S;
	protected readonly ovserverId: string;
	private lockCount: number;
	private readonly lockKeys: Map<number, boolean>;

	public abstract get panelType(): PanelType;
	public get el() { return this._el; }
	public get title(): string { return this._title; }
	constructor() {
		super();
		this._title = "";
		this.storage = this.getSavedStorage();
		this.ovserverId = createObserverId();
		this.lockCount = 0;
		this.lockKeys = new Map();
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
		this.lockCount++;
	}


	public unLock() {
		this.lockCount--;
		if (this.lockCount === 0) {
			this._el.classList.remove("loading");
		}
	}

	protected async loadingTransaction(execute: () => Promise<any>, option: TransactionOption) {
		if (option.delayLockKey) {
			if (this.lockKeys.has(option.delayLockKey)) {
				notify.info("2秒ぐらい操作をロックしています");
				throw new Error("遅延ロック中");
			} else {
				this.lockKeys.set(option.delayLockKey, true);
			}
		}
		if (this.lockCount > 0) {
			notify.info("パネルをロック中です");
			throw new Error("パネルをロック中");
		}
		this.lock();
		try {
			await execute();
		} finally {
			this.unLock();
			if (option.delayLockKey) {
				setTimeout(() => this.lockKeys.delete(option.delayLockKey!), 2000);
			}
			if (option.finallyExecute) {
				option.finallyExecute();
			}
		}
	}

	public canClose() {
		return false;
	}

	public onChangeSize() {
	}

	protected addKeyEvent(funcKey: "alt" | null, key: KeyCode, callback: () => void) {
		window.addEventListener("keydown", (event) => {
			if (!this.isActive) {
				return;
			}
			if (funcKey === "alt" && !event.altKey) {
				return;
			}
			if (event.keyCode === key) {
				callback();
			}
		});
	}
}