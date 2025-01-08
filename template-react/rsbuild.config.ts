import { defineConfig } from "@rsbuild/core";
import path from "path";
import { pluginReact } from "@rsbuild/plugin-react";
import AutoImport from "unplugin-auto-import/rspack";

export default () => ({
	resolve: {
		"@": path.resolve(__dirname, "./src"),
	},
	server: {
		port: process.env.PUBLIC_PORT,
	},
	plugins: [pluginReact()],
	tools: {
		rspack: {
			plugins: [
				AutoImport({
					imports: ["react", "react-router", "react-router-dom"],
					dts: "./src/auto-import.d.ts",
				}),
			],
		},
	},
});
