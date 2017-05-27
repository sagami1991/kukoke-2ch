
interface EmojiSheet {
	pointerCode: number[];
	raw: string;
	x: number;
	y: number;
}

class Emoji {
	private readonly regExp: RegExp;
	private readonly emojiMap: Map<number, EmojiSheet>;
	constructor() {
		const emojis: EmojiSheet[] = require("../../resource/emojis.json");
		this.emojiMap = new Map();
		for (const emoji of emojis) {
			this.emojiMap.set(emoji.pointerCode[0], emoji);
		}
		const pattern = Array.from(this.emojiMap.keys())
			.map(pointerCode => `&#${pointerCode};`)
			.join("|");
		this.regExp = new RegExp(`(${pattern})`, "g");
	}

	public replace(text: string) {
		return text.replace(this.regExp, ($0, $1: string) => {
			const codePoint = Number($1.slice(2, -1));
			const emoji = this.emojiMap.get(codePoint);
			if (!emoji) {
				return $1;
			}
			return `<span` +
					`class="emoji"` +
					`style="` +
						`background-position-x: ${2.5 * emoji.x}%;` +
						`background-position-y: ${2.5 * emoji.y}%;` +
					`">${$1}</span>`;
		});
	}
}

export const emoji = new Emoji();