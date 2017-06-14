import { notify } from '../common/libs';
import { SureModel } from 'model/sureModel';
import { ComponentScanner } from 'component/scanner';
import { Button, Textarea } from 'component/components';
import { Panel, PanelType, KeyCode } from './basePanel';
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
	"doneWrite": [SureModel, string];
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
		<div class="panel-container panel-form">
			<div class="panel-layer"></div>
			<div class="panel-loading-bar"></div>
			<div class="panel-content">
				<div class="form-container">
					${this._textarea.html()}
					<div class="form-buttons">
						${this._submitButton.html()}
					</div>
				</div>
			</div>
		</div>
		`;
	}

	constructor() {
		super();
		this._title = "書き込み";
		this._textarea = new Textarea({
			className: "form-textarea"
		});
		this._submitButton = new Button({
			icon: "icon-ok",
			iconSize: "s",
			label: "書き込み",
			subLabel: "Alt + W",
			onClick: () => this.submit(this._sure)
		});
		this._el = ComponentScanner.scanHtml(this.template());
		this._content = this._el.querySelector(".panel-content")!;
		super.addKeyEvent("alt", KeyCode.W, () => {
			this.submit(this._sure);
		});
	}

	private submit(sure: SureModel) {
		this.loadingTransaction(async () => {
			this._submitButton.toggleActive(true);
			const values = this.getValue();
			const result = await NichanSubmitClient.submitRes(sure.board, sure.datNo, values);
			if (result.type === "success") {
				notify.success(result.body, result.title);
				this.trigger("doneWrite", [sure, values.message]);
			} else {
				notify.error(result.body, result.title);
			}
		}, {
			finallyExecute: () => this._submitButton.toggleActive(false)
		});
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
		this.trigger("changeTitle", `書き込み - ${option.sure.titleName}`);
		this._textarea.element.focus();
		this._sure = option.sure;
	}

	protected getStorageForSave() { return {}; };
	protected getDefaultStorage() { return {}; };
	public canClose() {
		return true;
	}

}