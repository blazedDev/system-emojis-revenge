import { iosizeString } from "./emoji";
import { state } from "./controller";

// Busca módulos de metro cuyo código construya URIs de emoji
// ("asset:/emoji-...", "emoji-" + hex, etc.) y envuelve esas funciones
// para que devuelvan URLs de Apple.

function looksLikeEmojiModule(src: string): boolean {
    if (src.indexOf("surrogate") === -1 && src.indexOf("emoji") === -1) return false;
    return src.indexOf("asset:/") !== -1
        || src.indexOf("emoji-") !== -1
        || src.indexOf("codePoint") !== -1;
}

function wrapValue(v: any): any {
    if (typeof v === "function") {
        let src = "";
        try {
            src = Function.prototype.toString.call(v);
        } catch {
            return null;
        }
        if (src.indexOf("emoji-") === -1 && src.indexOf("asset:/") === -1 && src.indexOf("codePoint") === -1) {
            return null;
        }
        return function (this: any, ...args: any[]) {
            const r = v.apply(this, args);
            if (typeof r === "string") return iosizeString(r);
            if (r && typeof r === "object" && typeof r.uri === "string") {
                try {
                    const nu = iosizeString(r.uri);
                    if (nu !== r.uri) return { ...r, uri: nu };
                } catch {}
            }
            return r;
        };
    }
    return null;
}

function wrapExports(exps: any, depth: number): number {
    if (!exps || depth > 2) return 0;
    let n = 0;
    const t = typeof exps;
    if (t !== "object" && t !== "function") return 0;

    let keys: string[] = [];
    try {
        keys = Object.keys(exps);
    } catch {
        return 0;
    }

    for (const k of keys) {
        let cur: any;
        try {
            cur = exps[k];
        } catch {
            continue;
        }
        const w = wrapValue(cur);
        if (w) {
            try {
                Object.defineProperty(exps, k, {
                    value: w,
                    writable: true,
                    configurable: true,
                });
                n++;
                continue;
            } catch {}
        }
        if (cur && typeof cur === "object" && !Array.isArray(cur)) {
            n += wrapExports(cur, depth + 1);
        }
    }
    return n;
}

export function scanAndHookEmojiResolvers(): number {
    let hooked = 0;
    try {
        const mods = (globalThis as any).modules;
        const req = (globalThis as any).__r;
        if (!mods || typeof req !== "function") return 0;

        for (const idKey in mods) {
            if (hooked > 0 && hooked % 50 === 0) { /* límite blando */ }
            let src = "";
            try {
                const fac = mods[idKey]?.factory;
                if (typeof fac !== "function") continue;
                src = Function.prototype.toString.call(fac);
            } catch {
                continue;
            }
            if (!looksLikeEmojiModule(src)) continue;

            try {
                const exps = req(Number(idKey));
                hooked += wrapExports(exps, 0);
            } catch {}
        }
    } catch {}
    state.metro = hooked;
    return hooked;
}
