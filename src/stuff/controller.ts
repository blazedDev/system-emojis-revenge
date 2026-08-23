import { getStorage, reportError } from "./env";

import { convertMessageRows, getChatModule, patchRows } from "./rows";
import { installImagePatch } from "./images";

// Flags persistidos (best-effort; si el storage falla se usan los espejos)
export const vstorage = getStorage() as {
    patchMessages?: boolean;
    patchImages?: boolean;
    mode?: string;
};

export function getMode(): string {
    try {
        return vstorage.mode === "system" ? "system" : "ios";
    } catch {
        return "ios";
    }
}

export function setMode(m: string) {
    try {
        vstorage.mode = m;
    } catch {}
}

export function getPatchMessages(): boolean {
    try {
        return vstorage.patchMessages !== false;
    } catch {
        return true;
    }
}

export function getPatchImages(): boolean {
    try {
        return vstorage.patchImages !== false;
    } catch {
        return true;
    }
}

export function setFlag(key: "patchMessages" | "patchImages", v: boolean) {
    try {
        vstorage[key] = v;
    } catch {}
}

export const state = {
    chat: false,
    images: false,
    err: "",
    sample: "",
    metro: 0,
    scanMods: -1,
    scanCand: 0,
};

// Contadores internos (nunca se escriben al storage)
export const counters = { rows: 0, emoji: 0, imgs: 0 };

const unwinds: (() => void)[] = [];

export function unwindAll() {
    let u: (() => void) | undefined;
    while ((u = unwinds.pop())) {
        try {
            u();
        } catch {}
    }
}

export function resetDebug() {
    counters.rows = 0;
    counters.emoji = 0;
    counters.imgs = 0;
}

export function applyAll() {
    unwindAll();
    state.chat = false;
    state.images = false;
    resetDebug();

    if (getPatchMessages()) {
        const mod = getChatModule();
        if (!mod || typeof mod.updateRows !== "function") {
            console.warn("[SystemEmojisEverywhere] módulo del chat no encontrado");
        } else {
            const rowsPatch = patchRows(rows => {
                counters.rows++;
                if (!state.sample) {
                    try {
                        const hit = rows.find(r => r?.type === 1
                            && Array.isArray(r.message?.content)
                            && r.message.content.some(c => c && c.type === "emoji"));
                        if (hit) state.sample = JSON.stringify(hit.message.content).slice(0, 700);
                    } catch {}
                }
                counters.emoji += convertMessageRows(rows, getMode());
            });
            if (rowsPatch) {
                unwinds.push(rowsPatch);
                state.chat = true;
            }
        }
    }

    if (getPatchImages()) {
        const img = installImagePatch(() => {
            counters.imgs++;
        });
        unwinds.push(img.unwind);
        state.images = img.ok;
        state.err = img.ok ? "" : `imágenes: ${img.msg ?? "no disponible"}`;
    }
}
