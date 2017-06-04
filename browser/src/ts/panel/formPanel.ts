import { notify } from '../common/libs';
import { alertMessage } from '../common/utils';
import { SureModel } from 'model/sureModel';
import { ComponentScanner } from 'component/scanner';
import { Button, ButtonOption, Textarea } from 'component/components';
import { Panel, PanelType } from './basePanel';
import { NichanSubmitClient } from "client/nichanSubmitClient";

type SubmitType =  "resList" | "sureList";

export interface NichanFormValue {
	title: string;
	name: string;
	mail: string;
	message: string;
}
export interface OpenFormOption {
	submitType: SubmitType;
	sure: SureModel;
	initBody?: string;
}
interface FormPanelEvent {
	"doneWrite": SureModel;
}

export class SubmitFormPanel extends Panel<FormPanelEvent> {
	private _content: Element;
	// private _option: SubmitOption | undefined;
	private _sure: SureModel;
	private _textarea: Textarea;
	private _submitButton: Button;
	public get panelType(): PanelType {
		return "form";
	}

	// components
	private template() {
		return `
		<div class="panel-container panel-bbs-menu">
			<div class="panel-content">
				${this._textarea.html()}
				${this._submitButton.html()}
			</div>
		</div>
		`;
	}

	constructor() {
		super();
		this._title = "書き込み";
		this._textarea = new Textarea({});
		this._submitButton = new Button({
			icon: "icon-ok",
			iconSize: "s",
			label: "書き込み",
			subLabel: "Alt + W",
			onClick: () => this.submit(this._sure)
		});
		this._el = ComponentScanner.scanHtml(this.template());
		this._content = this._el.querySelector(".panel-content")!;
	}
	public async init() {
	}

	private async submit(sure: SureModel) {
		const result = await NichanSubmitClient.submitRes(sure.board, sure.datNo, this.getValue());
		if (result.type === "success") {
			notify.success(result.body, result.title);
			this.trigger("doneWrite", sure);
		} else {
			notify.error(result.body, result.title);
		}
	}

	private getValue(): NichanFormValue {
		return {
			title: "",
			mail: "",
			name: "",
			message: this._textarea.getValue(),
		};
	}
	public async openForm(option: OpenFormOption) {
		this._textarea.setValue(option.initBody || "");
		this._sure = option.sure;
	}

	protected getStorageForSave() { return {}; };
	protected getDefaultStorage() { return {}; };
	public canClose() {
		return true;
	}

}