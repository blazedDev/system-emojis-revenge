// Acceso perezoso y defensivo a la API de vendetta.
// NADA de esto se ejecuta al evaluar el módulo: todo se resuelve bajo demanda.

// Capturar el parámetro `vendetta` del cargador al inicializar el módulo.
// En Revenge es un PARÁMETRO de la función contenedora, no un global.
let VD: any;
try {
    VD = vendetta;
} catch {
    VD = undefined;
}

export function getVd(): any {
    if (VD) return VD;
    try {
        return (globalThis as any).vendetta;
    } catch {
        return undefined;
    }
}

export function getRN(): any {
    try {
        const rn = getVd()?.["metro.common"]?.ReactNative;
        if (rn) return rn;
    } catch {}
    try {
        return (globalThis as any).ReactNative;
    } catch {
        return undefined;
    }
}

export function getPatcher(): any {
    try {
        return getVd()?.patcher ?? getVd()?.["patcher"];
    } catch {
        return undefined;
    }
}

export function getToasts(): ((m: string) => void) | null {
    try {
        const st = getVd()?.["ui.toasts"]?.showToast;
        return typeof st === "function" ? (m: string) => st(m) : null;
    } catch {
        return null;
    }
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
