const path = require('path')
const gulp = require("gulp");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json", {typescript: require("typescript")});
const sourcemaps = require("gulp-sourcemaps");
const childProcess = require("child_process");;
var kill = require('tree-kill');
const Settings = {
	dist: "./build"
}
let node;

gulp.task("ts", () => {
	return gulp.src(["./src/**/*.ts", "!./src/**/*.spec.ts"])
	.pipe(sourcemaps.init())
	.pipe(tsProject())
	.pipe(sourcemaps.write("./", {sourceRoot: "../src"}))
	.pipe(gulp.dest(Settings.dist));
});

gulp.task("copy-resources", () => {
	return gulp.src(["./src/resources/", "./package.json"])
	.pipe(gulp.dest(`${Settings.dist}`));
});

gulp.task("watch", () => {
	gulp.start(["ts", "copy-resources","launch"]);
	gulp.watch(["./src/**/*.ts"], ["ts","relaunch"]);
});

gulp.task("launch", ["ts"], () => {
	node = launchServer();
})

gulp.task("relaunch", ["ts"], () => {
	kill(node.pid, "SIGKILL", () => {
		node = launchServer();
	});
})

function launchServer() {
	return childProcess.spawn(`${__dirname}/node_modules/.bin/electron.cmd`, [
		"./build/app.js"
		], { stdio: "inherit" })
}

gulp.task("default", ["ts"]);