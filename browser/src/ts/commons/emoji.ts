
class Emoji {
	private regExp: RegExp;

	constructor() {
		const emojis: string = require("../../resource/emojis.txt");
		// const emojisArray = Array.from(emojis);
		// const pattern = emojisArray
		// 	.join("|");
		// this.regExp = new RegExp("&#[0-9]+;", "g");
	}

	public replace(text: string) {
		return text;
		// return text.replace(this.regExp, ($0, $1) => {
		// 	return `<span class="emoji">${$0}</span>`;
		// });
	}
}

export const emoji = new Emoji();