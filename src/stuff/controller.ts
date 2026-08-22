import { getStorage, reportError } from "./env";

import { convertMessageRows, getChatModule, patchRows } from "./rows";
import { installImagePatch } from "./images";

export const vstorage = getStorage() as {
    patchMessages: boolean;
    patchImages: boolean;
    statusChat?: boolean;
    statusImages?: boolean;
    dbgRows?: number;
    dbgEmojiRows?: number;
    dbgImages?: number;
    errMsg?: string;
};

// Contadores internos (independientes del storage, siempre fiables)
export const counters = { rows: 0, emoji: 0, imgs: 0 };

function syncCounters() {
    try {
        vstorage.dbgRows = counters.rows;
        vstorage.dbgEmojiRows = counters.emoji;
        vstorage.dbgImages = counters.imgs;
    } catch {}
}

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
    syncCounters();
}

export function applyAll() {
    unwindAll();
    vstorage.statusChat = false;
    vstorage.statusImages = false;
    resetDebug();

    if (vstorage.patchMessages !== false) {
        try {
            const mod = getChatModule();
            if (!mod || typeof mod.updateRows !== "function") {
                reportError("chat", "módulo del chat no encontrado (updateRows ausente)");
            } else {
                const rowsPatch = patchRows(rows => {
                    counters.rows++;
                    counters.emoji += convertMessageRows(rows);
                    syncCounters();
                });
                if (rowsPatch) {
                    unwinds.push(rowsPatch);
                    vstorage.statusChat = true;
                }
            }
        } catch (e) {
            reportError("capa filas", e);
        }
    }

    if (vstorage.patchImages === true) {
        try {
            const img = installImagePatch(() => {
                counters.imgs++;
                syncCounters();
            });
            unwinds.push(img.unwind);
            vstorage.statusImages = img.ok;
        } catch (e) {
            reportError("capa imágenes", e);
        }
    }
}
