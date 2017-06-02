import { templateUtil } from "common/tmpl";

export type MyIcon =
	"icon-close" | "icon-maximize" | "icon-search" | "icon-reload" | "icon-pen" |
	"icon-image" | "icon-link" | "icon-arrow-dropdown" | "icon-filter" |
	"icon-navigate-back" | "icon-ok" | "icon-assignment" | "icon-toc" | "icon-comment" |
	"icon-delete-forever" | "icon-menu";
export type MyIconSize = "s" | "m";

const fixedSizeMap: {[key in MyIcon]?: {width: number, height: number}} = {
	"icon-ok": { width: 30, height: 20}
};
export function getSvgIcon(icon: MyIcon, size?: MyIconSize, className?: string): string {
	const fixedSize = fixedSizeMap[icon];
	return `
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-${size || "m"} ${className || ""}"
			${fixedSize ? `
				style="
					width: ${fixedSize.width}px;
					min-width: ${fixedSize.width}px;
					height: ${fixedSize.height}px;
				"` : ""
			}
		>
			<use xlink:href="#${icon}"/>
		</svg>
	`;
}