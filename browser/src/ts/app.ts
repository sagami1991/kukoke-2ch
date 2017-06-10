import { ImageViewerPanel } from './panel/imagePanel';
import { SubmitFormPanel } from './panel/formPanel';
import { createObserverId } from './base/observable';
import { db } from './database/database';
import { ResListPanel } from './panel/resListPanel';
import { SureListPanel } from './panel/sureListPanel';
import { BbsMenuPanel } from './panel/bbsMenuPanel';
import { BasePanelEvent, Panel } from './panel/basePanel';
import { TofuSheet } from './tofu/tofuSheet';
import { LeftSideBarView } from './view/leftSideBarView';
import "jquery-ui/ui/widgets/draggable";
import "jquery-ui/ui/widgets/resizable";
import "./common/contextmenu";
import { electron } from "common/libs";

class MyApp {
	// views
	// private readonly leftSideBar: LeftSideBarView;
	private readonly tofuSheet: TofuSheet;

	// panels
	private readonly allPanels: Panel[];
	private readonly boardListPanel: BbsMenuPanel;
	private readonly sureListPanel: SureListPanel;
	private readonly resListPanel: ResListPanel;
	private readonly submitFormPanel: SubmitFormPanel;
	private readonly imagePanel: ImageViewerPanel;

	constructor() {
		// this.leftSideBar = new LeftSideBarView();
		this.tofuSheet = new TofuSheet();
		this.allPanels = [
			this.boardListPanel = new BbsMenuPanel(),
			this.sureListPanel = new SureListPanel(),
			this.resListPanel = new ResListPanel(),
			this.submitFormPanel = new SubmitFormPanel(),
			this.imagePanel = new ImageViewerPanel(),
		];
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
		window.addEventListener("beforeunload", async () => {
			for (const panel of this.allPanels) {
				await panel.saveStorage();
			}
		});
		window.addEventListener("click", event => {
			const elem = <Element> event.target;
			if (elem.tagName === "A") {
				event.preventDefault();
				const href = elem.getAttribute("href");
				if (href) {
					electron.shell.openExternal(href);
				}
			}
		});
	}

	private async initPanel() {
		await this.boardListPanel.init();
		await this.sureListPanel.init();
		await this.resListPanel.init();
		const kariId = createObserverId();
		this.boardListPanel.addListener("openBoard", kariId, (board) => {
			this.lockPanelWrapper(this.sureListPanel, () => this.sureListPanel.openBoard(board));
		});
		this.boardListPanel.addListener("openRecent", kariId, () => {
			this.lockPanelWrapper(this.sureListPanel, () => this.sureListPanel.openRecent());
		});
		this.sureListPanel.addListener("openSure", kariId, (sure) => {
			this.lockPanelWrapper(this.resListPanel, () => this.resListPanel.openSure(sure));
		});
		this.resListPanel.addListener("changeSure", kariId, (sure) => {
			// await this.preListenPanel(this._sureListPanel);
			this.sureListPanel.onChangeSureModel(sure);
		});
		this.resListPanel.addListener("openForm", kariId, (option) => {
			this.lockPanelWrapper(this.submitFormPanel, () => this.submitFormPanel.openForm(option));
		});
		this.resListPanel.addListener("openImage", kariId, (url) => {
			this.lockPanelWrapper(this.imagePanel, () => this.imagePanel.openImage(url));
		});
		this.submitFormPanel.addListener("doneWrite", kariId, async (sure) => {
			this.tofuSheet.closeBlock(this.submitFormPanel.panelType);
			this.lockPanelWrapper(this.resListPanel, () => this.resListPanel.openSure(sure));
		});
	}

	private async lockPanelWrapper(panel: Panel, execute: () => Promise<any>) {
		await this.preListenPanel(panel);
		await panel.loadingTransaction(execute);
	}

	private async preListenPanel(panel: Panel) {
		if (!this.tofuSheet.isOpenedPanel(panel.panelType)) {
			await this.tofuSheet.addBlock(panel);
		}
		this.tofuSheet.toFront(panel.panelType);
	}

	private async initTofuSheet() {
		this.tofuSheet.init();
		await this.tofuSheet.addBlock(this.boardListPanel);
		await this.tofuSheet.addBlock(this.sureListPanel);
		await this.tofuSheet.addBlock(this.resListPanel);
	}
}

new MyApp();