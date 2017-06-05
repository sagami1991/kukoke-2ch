import { XhrRequestHeader } from '../common/request';
import { sureRepository } from '../database/sureRepository';
import { SureTable, BoardTable } from 'database/tables';
import { boardRepository } from "database/boardRepository";
import { FileUtil } from "common/commons";

export class SureModel {
	private readonly _id: number;
	private readonly _board: BoardTable;
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
	private _updatedAt: Date;

	private _ikioi: number;
	private _ikioiColor: "red" | "blackRed" | "";
	private _bookmarkIndex: number;
	private readonly _createdAt: Date;

	public get id() { return this._id; };
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
	public get bookmarkIndex() { return this._bookmarkIndex; }
	public set bookmarkIndex(bookmarkIndex: number) { this._bookmarkIndex = bookmarkIndex; }

	public set enabled(enable: boolean) { this._enabled = enable; }

	public static async createInstanceFromId(id: number): Promise<SureModel> {
		const sure = await sureRepository.getSure(id);
		if (!sure) {
			throw new Error("存在しないId");
		}
		const board = await boardRepository.getBoard(sure.bId);
		if (!board) {
			throw new Error("存在しない板");
		}
		return new SureModel(sure, board);
	}

	constructor(sure: SureTable, board: BoardTable) {
		this._id = sure.id;
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
		this._updatedAt = sure.updatedAt;
		this._bookmarkIndex = sure.bookmarkIndex || 0;
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
		this._resCount = resLength;
		this._savedResCount = resLength;
		this._isTemporary = true;
	}

	public reset() {
		this._saved = false;
		this._byteLength = undefined;
		this._lastModified = undefined;
		this._savedResCount = 0;
		this._isTemporary = false;
	}

	public getDatFilePath() {
		return FileUtil.getPath(`dat/${this._board.path}_${this._datNo}.dat`);
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

	public getRequestHeader(): XhrRequestHeader {
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

	public toJSON(): SureTable {
		return {
			id: this._id,
			bId: this.board.id,
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
			updatedAt: this._updatedAt,
			bookmarkIndex: this._bookmarkIndex
		};
	}

	public equal(self: SureModel | undefined) {
		return self && this._board.domain === self._board.domain &&
			this._board.path === self._board.path &&
			this._datNo === self._datNo;
	}

	public getSureUrl() {
		return `http://${this._board.subDomain}.${this._board.domain}/test/read.cgi/${this._board.path}/${this._datNo}/`;
	}
}