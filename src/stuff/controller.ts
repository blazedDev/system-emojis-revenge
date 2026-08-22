import { storage } from "@vendetta/plugin";

import { convertMessageRows, getChatModule, patchRows } from "./rows";
import { installImagePatch } from "./images";

export const vstorage = storage as {
    patchMessages: boolean;
    patchImages: boolean;
    statusChat?: boolean;
    statusImages?: boolean;
    dbgRows?: number;
    dbgEmojiRows?: number;
    dbgImages?: number;
    errMsg?: string;
};

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
    vstorage.dbgRows = 0;
    vstorage.dbgEmojiRows = 0;
    vstorage.dbgImages = 0;
}

export function applyAll() {
    unwindAll();
    vstorage.statusChat = false;
    vstorage.statusImages = false;
    resetDebug();

    if (vstorage.patchMessages !== false) {
        const mod = getChatModule();
        if (!mod || typeof mod.updateRows !== "function") {
            console.warn("[SystemEmojisEverywhere] módulo del chat no encontrado");
        } else {
            const rowsPatch = patchRows(rows => {
                vstorage.dbgRows = (vstorage.dbgRows ?? 0) + 1;
                vstorage.dbgEmojiRows =
                    (vstorage.dbgEmojiRows ?? 0) + convertMessageRows(rows);
            });
            if (rowsPatch) {
                unwinds.push(rowsPatch);
                vstorage.statusChat = true;
            }
        }
    }

    if (vstorage.patchImages === true) {
        const img = installImagePatch(() => {
            vstorage.dbgImages = (vstorage.dbgImages ?? 0) + 1;
        });
        unwinds.push(img.unwind);
        vstorage.statusImages = img.ok;
    }
}
