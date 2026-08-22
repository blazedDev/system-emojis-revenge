import esbuild from "esbuild";
import { mkdirSync, copyFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await esbuild.build({
    entryPoints: ["src/index.tsx"],
    outfile: "dist/index.js",
    bundle: true,
    format: "cjs",
    target: "esnext",
    jsx: "transform",
    minify: false,
    external: ["@vendetta/*", "@lib/*", "react", "react-native"],
});

copyFileSync("manifest.json", "dist/manifest.json");

console.log("Build OK -> dist/index.js");
