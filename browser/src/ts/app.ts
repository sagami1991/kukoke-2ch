import { FormPanel } from './panel/formPanel';
import { createObserverId } from './base/observable';
import { db } from './database/database';
import { ResListPanel } from './panel/resListPanel';
import { SureListPanel } from './panel/sureListPanel';
import { BbsMenuPanel } from './panel/bbsMenuPanel';
import { Panel } from './panel/basePanel';
import { TofuSheet } from './tofu/tofuSheet';
import { LeftSideBarView } from './view/leftSideBarView';
import { shell } from "electron";
import "jquery-ui/ui/widgets/draggable";
import "jquery-ui/ui/widgets/resizable";

class MyApp {
	// views
	private readonly _leftSideBar: LeftSideBarView;
	private readonly _tofuSheet: TofuSheet;

	// panels
	private readonly _allPanels: Panel[];
	private readonly _boardListPanel: BbsMenuPanel;
	private readonly _sureListPanel: SureListPanel;
	private readonly _resListPanel: ResListPanel;
	private readonly _formPanel: FormPanel;

	constructor() {
		this._leftSideBar = new LeftSideBarView();
		this._tofuSheet = new TofuSheet();
		this._allPanels = [
			this._boardListPanel = new BbsMenuPanel(),
			this._sureListPanel = new SureListPanel(),
			this._resListPanel = new ResListPanel(),
			this._formPanel = new FormPanel()];
		this.init();
	}

	private async init() {
		await db.open();
		await db.initQuery();
		this.initSvg();
		await this.initTofuSheet();
		await this.initPanel();
		this.registerEvent();
	}

	private initSvg() {
		const svgText = require("../resource/iconset.svg");
		const svgContainer = document.querySelector(".svg-container")!;
		svgContainer.innerHTML = svgText;
	}

	private registerEvent() {
		window.addEventListener("beforeunload", () => {
			this._allPanels.forEach(panel => {
				panel.saveStorage();
			});
		});

		window.addEventListener("click", event => {
			const elem = <Element> event.target;
			if (elem.tagName === "A") {
				event.preventDefault();
				const href = elem.getAttribute("href");
				if (href) {
					shell.openExternal(href);
				}
			}
		});
	}

	private async initPanel() {
		await this._boardListPanel.init();
		await this._sureListPanel.init();
		await this._resListPanel.init();
		const kariId = createObserverId();
		this._boardListPanel.addListener("openBoard", kariId, async (board) => {
			await this.preListenPanel(this._sureListPanel);
			this._sureListPanel.openBoard(board);
		});
		this._boardListPanel.addListener("openRecent", kariId, async () => {
			await this.preListenPanel(this._sureListPanel);
			this._sureListPanel.openRecent();
		});
		this._sureListPanel.addListener("openSure", kariId, async (sure) => {
			await this.preListenPanel(this._resListPanel);
			this._resListPanel.changeResListFromServer(sure);
		});
		this._resListPanel.addListener("changeSure", kariId, async (sure) => {
			// await this.preListenPanel(this._sureListPanel);
			this._sureListPanel.onChangeSureModel(sure);
		});
		this._resListPanel.addListener("openForm", kariId, async (option) => {
			await this.preListenPanel(this._formPanel);
			this._formPanel.openForm(option);
		});
		this._formPanel.addListener("doneWrite", kariId, async (sure) => {
			await this.preListenPanel(this._resListPanel);
			this._resListPanel.changeResListFromServer(sure);
		});
	}

	private async preListenPanel(panel: Panel) {
		if (!this._tofuSheet.isOpenedPanel(panel.panelType)) {
			await this._tofuSheet.addBlock(panel);
		}
		this._tofuSheet.toFront(panel.panelType);
	}

	private async initTofuSheet() {
		this._tofuSheet.init();
		await this._tofuSheet.addBlock(this._boardListPanel);
		await this._tofuSheet.addBlock(this._sureListPanel);
		await this._tofuSheet.addBlock(this._resListPanel);
	}
}

new MyApp();