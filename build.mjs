import esbuild from "esbuild";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

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

const js = readFileSync("dist/index.js");
const hash = createHash("sha256").update(js).digest("hex");

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
manifest.main = "index.js";
manifest.hash = hash;
writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 4));

console.log(`Build OK -> dist/index.js (sha256: ${hash.slice(0, 12)}...)`);
