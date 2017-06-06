import _remove from "lodash/remove";
import _escape from "lodash/escape";
import _isArray from "lodash/isArray";
import _uniqueId from "lodash/uniqueId";
import _uniq from "lodash/uniq";
import { remote }  from "electron";
export namespace _ {
	export const remove = _remove;
	export const escape = _escape;
	export const isArray = _isArray;
	export const uniqueId = _uniqueId;
	export const uniq = _uniq;
}

export namespace electron {
	export const {
		app,
		shell,
		Menu,
		dialog,
	 } = remote;
}

export const notify = toastr;