import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { convertMessageRows, patchRows } from "./rows";
import { installImagePatch } from "./images";

export const vstorage = storage as {
    patchMessages: boolean;
    patchImages: boolean;
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

export function applyAll() {
    unwindAll();

    if (vstorage.patchMessages !== false) {
        const rowsPatch = patchRows(convertMessageRows);
        if (rowsPatch) unwinds.push(rowsPatch);
        else {
            console.warn("[SystemEmojisEverywhere] No se encontró el módulo nativo del chat");
            showToast(
                "System Emojis: módulo del chat no encontrado",
                getAssetIDByName("CircleXIcon-primary"),
            );
        }
    }

    if (vstorage.patchImages === true) {
        unwinds.push(installImagePatch());
    }
}

export function defaults() {
    if (typeof vstorage.patchMessages !== "boolean") vstorage.patchMessages = true;
    if (typeof vstorage.patchImages !== "boolean") vstorage.patchImages = true;
}
