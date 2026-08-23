import { iosizeString } from "./emoji";
import { state } from "./controller";

// Estrategia v16:
// 1) Encontrar módulos cuya fuente mencione "surrogate" (renderer de filas emoji).
// 2) Envolver sus exportaciones tipo componente para reescribir los árboles de
//    elementos que devuelven: cualquier props.source.uri de emoji → URL Apple.

const MAX_CANDIDATE_MODULES = 60;
const MAX_FNS_PER_MODULE = 120;

function isReactEl(x: any): boolean {
    return !!x && typeof x === "object" && !!x.$$typeof;
}

function rewriteUriTarget(props: any): boolean {
    if (!props || typeof props !== "object") return false;
    const s = props.source;
    if ((globalThis as any).__SEE_DBG) {
        const emo = typeof s?.uri === "string" ? uriToEmoji(s.uri) : null;
        console.log("[SEE-uri] uri:", String(s?.uri).slice(0,44),
            "| emoji:", JSON.stringify(emo),
            "| apple:", appleUrlFromEmoji(emo ?? ""),
            "| iosize:", iosizeString(s?.uri)?.slice(0, 50),
        );
    }
    if (s && typeof s === "object" && typeof s.uri === "string") {
        const nu = iosizeString(s.uri);
        if (nu !== s.uri) {
            props.source = { ...s, uri: nu };
            return true;
        }
        return false;
    }
    if (typeof props.uri === "string") {
        const nu = iosizeString(props.uri);
        if (nu !== props.uri) {
            props.uri = nu;
            return true;
        }
    }
    return false;
}

const SEEN = new WeakSet();

function walkEl(el: any, depth: number): number {
    if (!el || depth > 12 || SEEN.has(el)) return 0;
    let changed = 0;
    try {
        if (isReactEl(el)) {
            if (rewriteUriTarget(el.props)) changed++;
            const ch = el.props?.children;
            if (Array.isArray(ch)) {
                for (const c of ch) changed += walkEl(c, depth + 1);
            } else {
                changed += walkEl(ch, depth + 1);
            }
        } else if (Array.isArray(el)) {
            for (const c of el) changed += walkEl(c, depth + 1);
        } else if (typeof el === "object") {
            if (rewriteUriTarget(el)) changed++;
            const ch = el.children ?? el.props?.children;
            if (ch) changed += walkEl(ch, depth + 1);
        }
    } catch {}
    return changed;
}

function wrapComponent(fn: any): any {
    const wrapped = function (this: any, ...args: any[]) {
        const out = fn.apply(this, args);
        if (out) {
            try {
                walkEl(out, 0);
            } catch {}
        }
        return out;
    };
    try {
        Object.defineProperty(wrapped, "name", { value: fn.name || "wrapped", configurable: true });
    } catch {}
    return wrapped;
}

function shouldWrapFn(f: any): boolean {
    try {
        const src = Function.prototype.toString.call(f);
        return src.includes("surrogate") || src.includes("emoji-") || src.includes("asset:/");
    } catch {
        return false;
    }
}

function hookExports(exps: any, depth: number, budget: { n: number }): number {
    if (!exps || depth > 3 || budget.n <= 0) return 0;
    let hooked = 0;
    let keys: any[] = [];
    try {
        keys = Object.keys(exps);
    } catch {
        return 0;
    }
    for (const k of keys) {
        if (budget.n <= 0) break;
        let cur: any;
        try {
            cur = exps[k];
        } catch {
            continue;
        }
        budget.n--;
        if (typeof cur === "function" && shouldWrapFn(cur)) {
            try {
                const w = wrapComponent(cur);
                Object.defineProperty(exps, k, { value: w, writable: true, configurable: true });
                hooked++;
                continue;
            } catch {}
        }
        if (cur && typeof cur === "object" && !Array.isArray(cur)) {
            hooked += hookExports(cur, depth + 1, budget);
        }
    }
    return hooked;
}

export function scanAndHookEmojiRenderers(): void {
    state.metro = 0;
    state.scanMods = -1;
    state.scanCand = 0;
    try {
        const mods = (globalThis as any).modules;
        const req = (globalThis as any).__r;
        if (!mods || typeof req !== "function") return;

        const ids: string[] = [];
        for (const id in mods) {
            state.scanMods++;
            let src = "";
            try {
                const fac = mods[id]?.factory;
                if (typeof fac !== "function") continue;
                src = Function.prototype.toString.call(fac);
            } catch {
                continue;
            }
            if (src.indexOf("surrogate") !== -1) ids.push(id);
        }
        state.scanCand = ids.length;

        let hooked = 0;
        for (const id of ids.slice(0, MAX_CANDIDATE_MODULES)) {
            try {
                const exps = req(Number(id));
                hooked += hookExports(exps, 0, { n: MAX_FNS_PER_MODULE });
            } catch {}
        }
        state.metro = hooked;
    } catch {}
}
