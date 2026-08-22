import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { convertMessageRows, patchRows } from "./rows";
import { installImagePatch } from "./images";

export const vstorage = storage as {
    patchMessages: boolean;
    patchImages: boolean;
    statusChat?: boolean;
    statusImages?: boolean;
};

const unwinds: (() => void)[] = [];

export function unwindAll() {
    let u: (() => void) | undefined;
    while ((u = unwinds.pop())) {
        try {
            u();
        } catch {}
    }
    vstorage.statusChat = false;
    vstorage.statusImages = false;
}

export function applyAll() {
    unwindAll();
    vstorage.statusChat = false;
    vstorage.statusImages = false;

    if (vstorage.patchMessages !== false) {
        const rowsPatch = patchRows(convertMessageRows);
        if (rowsPatch) {
            unwinds.push(rowsPatch);
            vstorage.statusChat = true;
        } else {
            console.warn("[SystemEmojisEverywhere] No se encontró el módulo nativo del chat");
            showToast(
                "System Emojis: módulo del chat no encontrado",
                getAssetIDByName("CircleXIcon-primary"),
            );
        }
    }

    if (vstorage.patchImages === true) {
        const img = installImagePatch();
        unwinds.push(img.unwind);
        vstorage.statusImages = img.ok;
    }
}
