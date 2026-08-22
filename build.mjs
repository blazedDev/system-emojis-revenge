import esbuild from "esbuild";
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";

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

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
manifest.main = "index.js";
writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 4));

console.log("Build OK -> dist/index.js");
