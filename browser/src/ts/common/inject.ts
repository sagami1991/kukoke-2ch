const registerd: { [key: string]: any } = {};
export function injectable(injectClass: Function, className?: string) {
	const instance = new (<any>injectClass)();
	registerd[injectClass.name] = instance;
}

export function inject(injectClass: Function) {
	return (target: any, property: string) => {
		target[property] = registerd[injectClass.name];
	};
}