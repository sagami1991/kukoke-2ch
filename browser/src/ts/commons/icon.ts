import { tmpl } from "commons/tmpl";

export type MyIcon =
	"icon-close" | "icon-maximize" | "icon-search" | "icon-reload" | "icon-pen" |
	"icon-image" | "icon-link" | "icon-arrow-dropdown" | "icon-filter" |
	"icon-navigate-back" | "icon-ok" | "icon-assignment" | "icon-toc" | "icon-comment";
export type MyIconSize = "s" | "m";

const fixedSize: {[key in MyIcon]?: {width: number, height: number}} = {
	"icon-ok": { width: 30, height: 20}
};
export function getSvgIcon(icon: MyIcon, size?: MyIconSize, className?: string): string {
	return `
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-${size || "m"} ${className || ""}"
			${tmpl.when(fixedSize[icon], () => `
			style="
				width: ${fixedSize[icon]!.width}px;
				min-width: ${fixedSize[icon]!.width}px;
				height: ${fixedSize[icon]!.height}px;
			"`)}
		>
			<use xlink:href="#${icon}"/>
		</svg>
	`;
}