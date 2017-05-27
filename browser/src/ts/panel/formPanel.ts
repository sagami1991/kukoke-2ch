import { SureModel } from 'model/sureModel';
import { PanelType } from 'tofu/tofuDefs';
import { ComponentScanner } from 'component/scanner';
import { Button, ButtonOption, Textarea } from 'component/components';
import { Panel } from './basePanel';

type SubmitType =  "res" | "sure";
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
			onClick: () => {}
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