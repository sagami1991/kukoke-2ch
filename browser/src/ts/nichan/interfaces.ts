export interface ResAttr {
	index: number;
	name: string;
	mail: string;
	postDate: string;
	userId: string;
	userBe?: {id: string; displayName: string};
	body: string;
	fromAnkers: number[];
	thumbs: Thumb[];
	/** IDの色 */
	idColor: "red" | "blue" | "normal";
	/** (4/5)のようなIDの数 */
	idCount: string;
	/** レス番の色 */
	noColor: "red" | "blue" | "normal";
	isNew: boolean;
}


export interface Thumb {
	isOpen: boolean;
	url: string;
}
