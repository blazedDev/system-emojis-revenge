import esbuild from "esbuild";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });

const vdShim = {
    name: "vendetta-shim",
    setup(build) {
        build.onResolve({ filter: /^@vendetta\// }, args => ({
            path: args.path,
            namespace: "vd-shim",
        }));
        build.onLoad({ filter: /.*/, namespace: "vd-shim" }, args => {
            const key = args.path.slice("@vendetta/".length).split("/").join(".");
            return {
                contents: `module.exports = vendetta[${JSON.stringify(key)}];`,
                loader: "js",
            };
        });
    },
};

await esbuild.build({
    entryPoints: ["src/index.tsx"],
    outfile: "dist/index.js",
    bundle: true,
    format: "iife",
    globalName: "__vd_plugin",
    target: "esnext",
    jsx: "transform",
    minify: false,
    external: [],
    plugins: [vdShim],
    footer: { js: "return __vd_plugin;" },
});

let js = readFileSync("dist/index.js", "utf8");
js = js.replace(/^"use strict";\n?/, "");

const wrapped = `(() => {
"use strict";
try {
${js}
} catch (e) {
  try {
    vendetta["ui.toasts"].showToast("System Emojis ERROR eval: " + String((e && e.stack) || e).slice(0, 150));
  } catch (_e) {}
  throw e;
}
})();`;

writeFileSync("dist/index.js", wrapped);

const hash = createHash("sha256").update(wrapped).digest("hex");

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
manifest.main = "index.js";
manifest.hash = hash;
writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 4));

console.log(`Build OK -> dist/index.js (${wrapped.length}B, sha256: ${hash.slice(0, 12)}...)`);
