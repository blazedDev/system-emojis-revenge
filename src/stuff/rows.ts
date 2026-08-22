import { ReactNative as RN } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";

export type ContentRow = {
    type: string;
    [key: PropertyKey]: any;
};

function iterateContent(rows: ContentRow[]): ContentRow[] {
    const out: ContentRow[] = [];
    let header: ContentRow | undefined;

    for (const original of rows) {
        let row = original;
        if (row?.type === "emoji") row = { type: "text", content: row.surrogate };
        if ("content" in row && Array.isArray(row.content)) row.content = iterateContent(row.content);
        if ("items" in row && Array.isArray(row.items)) row.items = iterateContent(row.items);

        if ("jumboable" in original && original.jumboable && !header) {
            header = { type: "heading", level: 1, content: [] };
        }
        if (
            (original.type === "emoji" || original.type === "customEmoji")
            && !original.jumboable
            && header
        ) {
            out.push(header);
            header = undefined;
        }

        if (header) header.content.push(row);
        else out.push(row);
    }

    if (header) out.push(header);
    return out;
}

export function convertMessageRows(rows: any[]) {
    for (const row of rows) {
        if (row?.type === 1 && row.message?.content) {
            row.message.content = iterateContent(row.message.content);
        }
    }
}

function getNativeModule(...names: string[]): any {
    for (const name of names) {
        const turbo = (globalThis as any).__turboModuleProxy;
        if (typeof turbo === "function") {
            try {
                const m = turbo(name);
                if (m) return m;
            } catch {}
        }
        const nmp = (globalThis as any).nativeModuleProxy;
        if (nmp?.[name]) return nmp[name];
    }
    return undefined;
}

export function getChatModule(): any {
    return getNativeModule("NativeChatModule", "DCDChatManager");
}

export function patchRows(callback: (rows: any[]) => void): (() => void) | null {
    const mod = getChatModule();
    if (!mod?.updateRows) return null;
    return before("updateRows", mod, args => {
        try {
            const rows = JSON.parse(args[1]);
            callback(rows);
            args[1] = JSON.stringify(rows);
        } catch (e: any) {
            console.error("[SystemEmojisEverywhere] rows:", e?.stack ?? e);
        }
    });
}
