import { alertMessage } from '../common/utils';
import { SureModel } from 'model/sureModel';
import { ComponentScanner } from 'component/scanner';
import { Button, ButtonOption, Textarea } from 'component/components';
import { Panel, PanelType } from './basePanel';

type SubmitType =  "resList" | "sureList";
export interface OpenFormOption {
	submitType: SubmitType;
	sure: SureModel;
	initBody?: string;

}
interface FormPanelEvent {
	"doneWrite": OpenFormOption;
}

export class FormPanel extends Panel<FormPanelEvent> {
	private _content: Element;
	// private _option: SubmitOption | undefined;

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
			onClick: () => { alertMessage("info", "未実装")}
		});
		this._el = ComponentScanner.scanHtml(this.template());
		this._content = this._el.querySelector(".panel-content")!;
	}
	public async init() {
	}

	public async openForm(option: OpenFormOption) {
		this._textarea.setValue(option.initBody || "");
	}

	protected getStorageForSave() { return {}; };
	protected getDefaultStorage() { return {}; };


}