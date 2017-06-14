export interface Res {
	index: number;
	name: string;
	mail: string;
	postDate: string;
	userId: string;
	userBe?: UserBe;
	body: string;
	fromAnkers: number[];
	userIndexes: number[];
	isNew: boolean;
	imageUrls: string[];
	isAsciiArt: boolean;
	isMyRes: boolean;
	isReplyRes: boolean;
}

export interface UserBe {
	id: string;
	displayName: string;
}

export class ResModel {
	public readonly index: number;
	public readonly name: string;
	public readonly mail: string;
	public readonly postDate: string;
	public readonly userId: string;
	public readonly userBe?: UserBe;
	public readonly body: string;
	public readonly fromAnkers: number[];
	public readonly userIndexes: number[];
	public readonly isNew: boolean;
	public readonly imageUrls: string[];
	public readonly isAsciiArt: boolean;
	public readonly isMyRes: boolean;
	public readonly isReplyRes: boolean;

	constructor(attr: Res) {
		this.index = attr.index;
		this.name = attr.name;
		this.mail = attr.mail;
		this.postDate = attr.postDate;
		this.userId = attr.userId;
		this.userBe = attr.userBe;
		this.body = attr.body;
		this.fromAnkers = attr.fromAnkers;
		this.userIndexes = attr.userIndexes;
		this.isNew = attr.isNew;
		this.imageUrls = attr.imageUrls;
		this.isAsciiArt = attr.isAsciiArt;
		this.isMyRes = attr.isMyRes;
		this.isReplyRes = attr.isReplyRes;
	}

	public getIndexFormat() {
		const count = this.fromAnkers.length;
		return count ? `(${count})` : ``;
	}

	/** (2/4)のような文字列 */
	public getIdCountFormat(): string {
		if (this.userIndexes.length === 1) {
			return "";
		}
		return `(${this.userIndexes.indexOf(this.index) + 1}/${this.userIndexes.length})`;
	}

	public getIdColor(): "red" | "blue" | "normal" {
		if (this.userIndexes.length >= 5) {
			return "red";
		} else if (this.userIndexes.length >= 2) {
			return "blue";
		} else {
			return "normal";
		}
	}

	public getResColor(): "red" | "blue" | "normal" {
		if (this.fromAnkers.length >= 3) {
			return "red";
		} else if (this.fromAnkers.length >= 1) {
			return "blue";
		} else {
			return "normal";
		}
	}
}