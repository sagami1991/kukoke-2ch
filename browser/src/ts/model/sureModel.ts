import { SureAttr, BoardAttr } from 'database/tables';

export class SureModel {
	private readonly _board: BoardAttr;
	private readonly _datNo: number;
	private readonly _index?: number;
	private _displayName: string;
	private _resCount: number;
	private _savedResCount?: number;
	private _saved: boolean;
	private _enabled: boolean;
	private _byteLength: number | undefined;
	private _lastModified: string | undefined;
	private _isTemporary: boolean;

	private _ikioi: number;
	private _ikioiColor: "red" | "blackRed" | "";
	private readonly _createdAt: Date;

	public get board() { return this._board; };
	public get titleName() { return this._displayName; };
	public get datNo() { return this._datNo; };
	public get ikioi() { return this._ikioi; }
	public get ikioiColor() { return this._ikioiColor; }
	public get createdAt() { return this._createdAt; }
	public get resCount() { return this._resCount; }
	public get savedResCount() { return this._savedResCount; }
	public get saved() { return this._saved; }
	public get enabled() { return this._enabled; }

	public set enabled(enable: boolean) { this._enabled = enable; }

	constructor(sure: SureAttr, board: BoardAttr) {
		this._board = board;
		this._datNo = sure.datNo;
		this._index = sure.index;
		this._displayName = sure.displayName;
		this._resCount = sure.resCount;
		this._savedResCount = sure.savedResCount;
		this._saved = sure.saved ? true : false;
		this._enabled = sure.enabled ? true : false;
		this._byteLength = sure.byteLength;
		this._lastModified = sure.lastModified;
		this._isTemporary = sure.isTemporary ? true : false;
		this._createdAt = new Date(Number(sure.datNo) * 1000);
		this._ikioi = this.calcIkioi();
	}

	private calcIkioi() {
		let deltaTime = new Date().getTime() - this._createdAt.getTime();
		deltaTime = deltaTime < 1000 ? 1000 : deltaTime;
		return this.resCount / deltaTime * 1000 * 3600 * 24;
	}

	public update(title: string, byteLength: number, lastModified: string, resLength: number) {
		this._displayName = title;
		this._saved = true;
		this._byteLength = byteLength;
		this._lastModified = lastModified;
		// const threadStatus = +headers["thread-status"];
		this._resCount = resLength;
		this._savedResCount = resLength;
		this._isTemporary = true;
	}

	// private isEnable(threadStatus: Nichan.ThreadStatus) {
	// 	return threadStatus === Nichan.ThreadStatus.ENABLED;
	// }

	public reset() {
		this._saved = false;
		this._byteLength = undefined;
		this._lastModified = undefined;
		this._savedResCount = 0;
		this._isTemporary = false;
	}

	public getDatFilePath() {
		return `dat/${this._board.path}_${this._datNo}.dat`;
	}

	public setIkioiColor(ikioiAve: number) {
		if (this.ikioi > ikioiAve * 3) {
			this._ikioiColor = "red";
		} else if (this.ikioi > ikioiAve * 2) {
			this._ikioiColor = "blackRed";
		} else {
			this._ikioiColor = "";
		}
	}

	public getRequestHeader() {
		if (!this._saved) {
			return {};
		} else {
			return {
				"If-Modified-Since": this._lastModified!,
				"Range": `bytes=${this._byteLength!}-`,
			};
		}
	}

	public getKb(): string {
		if (this._byteLength === undefined) {
			return "error";
		}
		return (this._byteLength / 1000).toFixed(2);
	}

	public toJSON(): SureAttr {
		return {
			bDomain: this._board.domain,
			bPath: this._board.path,
			datNo: this._datNo,
			index: this._index,
			displayName: this._displayName,
			resCount: this._resCount,
			savedResCount: this._savedResCount,
			enabled: this._enabled ? 1 : 0,
			saved: this._saved ? 1 : 0,
			isTemporary: this._isTemporary ? 1 : 0,
			byteLength: this._byteLength,
			lastModified: this._lastModified,
		};
	}

	public equal(self: SureModel | undefined) {
		return self && this._board.domain === self._board.domain &&
			this._board.path === self._board.path &&
			this._datNo === self._datNo;
	}
}