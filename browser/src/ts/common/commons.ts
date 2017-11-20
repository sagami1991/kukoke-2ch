import { jsonParse, jsonString, alertMessage } from './utils';
import { MyStorage, StorageType } from './storage';
import { RequestOption, xhrRequest, XhrResponse, sjisBufferToStr } from "./request";
import { TemplateUtil } from "./template";
import { IconName, IconSize, getSvgIcon } from './icon';
import { ElementUtil } from "./element";
import { FileUtil } from "./file";

export {
	RequestOption, xhrRequest, XhrResponse, sjisBufferToStr,
	TemplateUtil,
	MyStorage, StorageType,
	IconName, IconSize, getSvgIcon,
	ElementUtil,
	FileUtil,
	jsonParse, jsonString, alertMessage
};

export function toHighlightHtml(body: string, highlightWord: string) {
	if (!body || !highlightWord) {
		return body;
	}
	const index = body.indexOf(highlightWord);
	if (index === -1) {
		return body;
	}
	return body.substring(0, index) + "<span class='highlight-word'>" + body.substring(index, index + highlightWord.length) + "</span>" + body.substring(index + highlightWord.length);


}