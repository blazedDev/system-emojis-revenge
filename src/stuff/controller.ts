import { getStorage, reportError } from "./env";

import { convertMessageRows, getChatModule, patchRows } from "./rows";
import { installImagePatch } from "./images";

// Flags persistidos (best-effort; si el storage falla se usan los espejos)
export const vstorage = getStorage() as {
    patchMessages?: boolean;
    patchImages?: boolean;
};

export function getPatchMessages(): boolean {
    try {
        return vstorage.patchMessages !== false;
    } catch {
        return true;
    }
}

export function getPatchImages(): boolean {
    try {
        return vstorage.patchImages === true;
    } catch {
        return false;
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
                counters.emoji += convertMessageRows(rows);
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
