export interface ResAttr {
	index: number;
	name: string;
	mail: string;
	postDate: string;
	userId: string;
	userBe?: ResBeInfo;
	body: string;
	fromAnkers: number[];
	userIndexes: number[];
	isNew: boolean;
}

export interface ResBeInfo {
	id: string;
	displayName: string;
}

export class ResModel {
	private readonly _index: number;
	private readonly _name: string;
	private readonly _mail: string;
	private readonly _postDate: string;
	private readonly _userId: string;
	private readonly _userBe?: ResBeInfo;
	private readonly _body: string;
	private readonly _fromAnkers: number[];
	private readonly _userIndexes: number[];
	private readonly _isNew: boolean;

	public get index(): number {
		return this._index;
	}
	public get name(): string {
		return this._name;
	}
	public get mail(): string {
		return this._mail;
	}
	public get postDate(): string {
		return this._postDate;
	}
	public get userId(): string {
		return this._userId;
	}
	public get userBe(): ResBeInfo | undefined {
		return this._userBe;
	}
	public get body(): string {
		return this._body;
	}
	public get fromAnkers(): number[] {
		return this._fromAnkers;
	}
	public get userIndexes(): number[] {
		return this._userIndexes;
	}
	public get isNew(): boolean {
		return this._isNew;
	}

	constructor(attr: ResAttr) {
		this._index = attr.index;
		this._name = attr.name;
		this._mail = attr.mail;
		this._postDate = attr.postDate;
		this._userId = attr.userId;
		this._userBe = attr.userBe;
		this._body = attr.body;
		this._fromAnkers = attr.fromAnkers;
		this._userIndexes = attr.userIndexes;
		this._isNew = attr.isNew;
	}

	/** (2/4)のような文字列 */
	public getIdCountFormat() {
		return `${this._userIndexes.indexOf(this._index) + 1}/${this._userIndexes.length}`;
	}

	public getIdColor(): "red" | "blue" | "normal" {
		if (this._userIndexes.length >= 5) {
			return "red";
		} else if (this._userIndexes.length >= 2) {
			return "blue";
		} else {
			return "normal";
		}
	}

	public getResColor(): "red" | "blue" | "normal" {
		if (this._fromAnkers.length >= 3) {
			return "red";
		} else if (this._fromAnkers.length >= 1) {
			return "blue";
		} else {
			return "normal";
		}
	}
}