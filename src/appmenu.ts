export function getMenuItems() {
	const menuItems: Electron.MenuItemConstructorOptions[] = [
		{
			label: "編集",
			submenu: [
				{
					label: "元に戻す",
					role: "undo"
				},
				{
					label: "やり直し",
					role: "redo"
				},
				{
					type: "separator"
				},
				{
					role: "cut"
				},
				{
					role: "copy"
				},
				{
					role: "paste"
				},
				{
					role: "pasteandmatchstyle"
				},
				{
					role: "delete"
				},
				{
					role: "selectall"
				}
			]
		},
		{
			label: "表示",
			submenu: [
				{
					label: "リロード",
					accelerator: "CmdOrCtrl+R",
					click: (item, focusedWindow) => { focusedWindow.reload() }
				},
				{
					type: "separator"
				},
				{
					label: "ズームのリセット",
					role: "resetzoom"
				},
				{
					label: "ズームイン",
					role: "zoomin"
				},
				{
					label: "ズームアウト",
					role: "zoomout"
				}
			]
		},
		{
			role: "help",
			label: "ヘルプ",
			submenu: [
				{
					label: "開発者モード",
					accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
					click: (item, focusedWindow) => {
						if (focusedWindow) focusedWindow.webContents.toggleDevTools();
					}
				},
				{
					label: "開発者のツイッター",
					click() { require("electron").shell.openExternal("https://twitter.com/socket1016"); }
				},
				{
					label: "ソースコード（github）",
					click() { require("electron").shell.openExternal("https://github.com/socket1016/kukoke-2ch"); }
				},
			]
		}
	];

	return menuItems;
}
