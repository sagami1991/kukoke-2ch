export interface IRes {
	index: number;
	name: string;
	mail: string;
	postDate: string;
	userId: string;
	userBe?: IUserBe;
	body: string;
	fromAnkers: number[];
	userIndexes: number[];
	isNew: boolean;
	imageUrls: string[];
}

export interface IUserBe {
	id: string;
	displayName: string;
}

export class ResModel {
	public readonly index: number;
	public readonly name: string;
	public readonly mail: string;
	public readonly postDate: string;
	public readonly userId: string;
	public readonly userBe?: IUserBe;
	public readonly body: string;
	public readonly fromAnkers: number[];
	public readonly userIndexes: number[];
	public readonly isNew: boolean;
	public readonly imageUrls: string[];

	constructor(attr: IRes) {
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
	}

	public getIndexFormat() {
		const count = this.fromAnkers.length;
		return count ? `(${count})` : ``; 
	}

	/** (2/4)のような文字列 */
	public getIdCountFormat() {
		return `${this.userIndexes.indexOf(this.index) + 1}/${this.userIndexes.length}`;
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