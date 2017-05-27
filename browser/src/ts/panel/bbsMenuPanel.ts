import { StorageType } from 'common/commons';
import { bbsMenuService } from 'service/bbsMenuService';
import { ComponentScanner } from 'component/scanner';
import { RadioButton, RadioButtonOption, SearchText, SearchTextOption, List, ListOption, Button, ButtonOption } from 'component/components';
import { BasePanelEvent, Panel, PanelType } from './basePanel';
import { BoardTable } from "database/tables";

type BbsMenuMode =  "allList" | "history";
interface BbsMenuPanelEvent {
	"openBoard": BoardTable;
}
interface BbsMenuStorage {
	mode: BbsMenuMode;
}

export class BbsMenuPanel extends Panel<BbsMenuPanelEvent, BbsMenuStorage> {
	private _mode: BbsMenuMode;
	private _allBoards: BoardTable[];
	private _displayBoards: BoardTable[];

	public get panelType(): PanelType {
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
		this._displayBoards = this._allBoards.filter(board => board.displayName.match(text) !== null);
		this._list.changeData(this._displayBoards);
	};

	private async reload() {
		this._allBoards = await bbsMenuService.getBoardsFromNichan();
		await this.refreshBoards();
	}

	private async refreshBoards() {
		switch (this._mode) {
		case "allList":
			this._displayBoards = this._allBoards;
			break;
		case "history":
			this._displayBoards = await bbsMenuService.getBoardsHistories();
			break;
		}
		this._list.changeData(this._displayBoards);
	}

	private openBoard(board: BoardTable) {
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