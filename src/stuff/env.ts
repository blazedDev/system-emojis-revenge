// Acceso perezoso y defensivo a la API de vendetta.
// NADA de esto se ejecuta al evaluar el módulo: todo se resuelve bajo demanda.

// Capturar los parámetros del cargador al inicializar el módulo.
let VD: any;
try {
    VD = vendetta;
} catch {
    VD = undefined;
}
let BUNNY: any;
try {
    BUNNY = bunny;
} catch {
    BUNNY = undefined;
}

export function getVd(): any {
    if (VD) return VD;
    try {
        return (globalThis as any).vendetta;
    } catch {
        return undefined;
    }
}

export function getBunny(): any {
    if (BUNNY) return BUNNY;
    try {
        return (globalThis as any).bunny;
    } catch {
        return undefined;
    }
}

export function getRN(): any {
    const cands = [
        () => getVd()?.["metro.common"]?.ReactNative,
        () => getBunny()?.metro?.common?.ReactNative,
        () => getBunny()?.ReactNative,
        () => (globalThis as any).ReactNative,
    ];
    for (const c of cands) {
        try {
            const rn = c();
            if (rn) return rn;
        } catch {}
    }
    return undefined;
}

export function getReact(): any {
    const cands = [
        () => getVd()?.["metro.common"]?.React,
        () => getBunny()?.metro?.common?.React,
        () => getBunny()?.React,
        () => (globalThis as any).React,
    ];
    for (const c of cands) {
        try {
            const r = c();
            if (r) return r;
        } catch {}
    }
    return undefined;
}

export function getPatcher(): any {
    const cands = [
        () => getVd()?.patcher,
        () => getBunny()?.api?.patcher,
    ];
    for (const c of cands) {
        try {
            const p = c();
            if (p?.before) return p;
        } catch {}
    }
    return undefined;
}

export function getToasts(): ((m: string) => void) | null {
    const cands = [
        () => getVd()?.["ui.toasts"]?.showToast,
        () => getBunny()?.ui?.toasts?.showToast,
    ];
    for (const c of cands) {
        try {
            const st = c();
            if (typeof st === "function") return (m: string) => st(m);
        } catch {}
    }
    return null;
}

let storageFallback: Record<string, any> | null = null;

export function getStorage(): Record<string, any> {
    try {
        const s = getVd()?.plugin?.storage;
        if (s && typeof s === "object") return s;
    } catch {}
    if (!storageFallback) storageFallback = {};
    return storageFallback;
}

// Reporte de errores por Alert nativo de React Native (siempre disponible).
export function reportError(scope: string, e: unknown): void {
    let text = "";
    try {
        text = String((e as any)?.stack || e).slice(0, 400);
    } catch {
        text = String(e);
    }
    try {
        console.error("[SystemEmojisEverywhere]", scope, text);
    } catch {}
    try {
        const Alert = getRN()?.Alert;
        if (Alert?.alert) {
            Alert.alert("System Emojis ERROR", scope + "\n\n" + text);
            return;
        }
    } catch {}
    try {
        const t = getToasts();
        if (t) t(scope + ": " + text);
    } catch {}
}

export function toast(m: string): void {
    try {
        console.log("[SystemEmojisEverywhere]", m);
    } catch {}
    try {
        const t = getToasts();
        if (t) t(m);
    } catch {}
}
