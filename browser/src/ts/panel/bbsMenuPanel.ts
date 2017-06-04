import { bbsMenuService } from 'service/bbsMenuService';
import { ComponentScanner } from 'component/scanner';
import { RadioButton, RadioButtonOption, SearchText, SearchTextOption, List, ListOption, Button, ButtonOption } from 'component/components';
import { Panel, TPanelType } from './basePanel';
import { BoardTable } from "database/tables";

type BbsMenuMode =  "allList" | "history";
interface BbsMenuPanelEvent {
	"openBoard": BoardTable;
	"openRecent": void;
}
interface BbsMenuStorage {
	mode: BbsMenuMode;
}

export class BbsMenuPanel extends Panel<BbsMenuPanelEvent, BbsMenuStorage> {
	private _mode: BbsMenuMode;
	private _allBoards: BoardTable[];

	public get panelType(): TPanelType {
		return "board";
	}

	// components
	private readonly _list: List<BoardTable>;
	private readonly _modeRadio: RadioButton<BbsMenuMode>;
	private readonly _reloadButton: Button;
	private readonly _searchText: SearchText;
	private template() {
		return `
		<div class="panel-container panel-bbs-menu">
			<div class="panel-command-bar">
				${this._modeRadio.html()}
				${this._searchText.html()}
				${this._reloadButton.html()}
			</div>
			<div class="panel-content">
				${this._list.html()}
			</div>
		</div>
		`;
	}

	constructor() {
		super();
		this._title = "板一覧";
		this._mode = this._storage.mode;
		this._list = new List<BoardTable>(this.getListOption());
		this._modeRadio = new RadioButton<BbsMenuMode>(this.getRadioButtonOption());
		this._reloadButton = new Button(this.getReloadButtonOption());
		this._searchText = new SearchText(this.getSearchTextOption());
		this._el = ComponentScanner.scanHtml(this.template());
	}

	public async init() {
		this._allBoards = await bbsMenuService.getAllBoardsFromDb();
		if (this._allBoards.length === 0) {
			this._allBoards = await bbsMenuService.getBoardsFromNichan();
		};
		await this.refreshBoards();
	}

	private getListOption(): ListOption<BoardTable> {
		return {
			array: [],
			cellOptions: [
				{
					label: "板名",
					parse: board => board.displayName
				}
			],
			onRowClick: (board) => this.openBoard(board),
			noHeader: true
		};
	}

	private getRadioButtonOption(): RadioButtonOption<BbsMenuMode> {
		return {
			items: [
				{label: "全板", value: "allList"},
				{label: "最近", value: "history"}
			],
			initValue: this._mode,
			onChangeValue: async (value) => {
				this._mode = value;
				this.refreshBoards();
			}
		};
	}

	private getReloadButtonOption(): ButtonOption {
		return {
			icon: "icon-reload",
			iconSize: "m",
			style: "icon-only",
			onClick: () => this.reload()
		};
	}

	private getSearchTextOption(): SearchTextOption {
		return {
			width: 160,
			placeholder: "板名を検索",
			onChange: (text) => this.search(text)
		};
	}

	private search(text: string) {
		if (!this._allBoards || this._mode === "history") {
			return;
		}
		const boards =  this._allBoards.filter(board => board.displayName.match(text) !== null);
		this._list.changeData(boards);
	};

	private async reload() {
		this._allBoards = await bbsMenuService.getBoardsFromNichan();
		await this.refreshBoards();
	}

	private async refreshBoards() {
		let boards: BoardTable[] = [];
		switch (this._mode) {
		case "allList":
			boards = this._allBoards;
			break;
		case "history":
			const historiedBoards = await bbsMenuService.getBoardsHistories();
			boards = [this.getRecentOpenSure(), ...historiedBoards];
			break;
		}
		this._list.changeData(boards);
	}

	private getRecentOpenSure(): BoardTable {
		return {
			id: -1,
			domain: "",
			subDomain: "",
			path: "",
			displayName: "最近開いたスレ",
			type: "recentOpen",
		};
	}

	private openBoard(board: BoardTable) {
		if (board.type === "recentOpen") {
			this.trigger("openRecent", undefined);
			return;
		}
		bbsMenuService.addHistory(board);
		this.trigger("openBoard", board);
	}

	/** @override */
	protected getStorageForSave(): BbsMenuStorage {
		return {
			mode: this._mode
		};
	}

	/** @override */
	protected getDefaultStorage(): BbsMenuStorage {
		return {
			mode: "allList",
		};
	}
}