import { getPatcher } from "./env";

export type ContentRow = {
    type: string;
    [key: PropertyKey]: any;
};

function iterateContent(rows: ContentRow[]): [ContentRow[], number] {
    const out: ContentRow[] = [];
    let header: ContentRow | undefined;
    let converted = 0;

    for (const original of rows) {
        let row = original;
        if (row?.type === "emoji") {
            row = { type: "text", content: row.surrogate };
            converted++;
        }
        if ("content" in row && Array.isArray(row.content)) {
            const [c, n] = iterateContent(row.content);
            row.content = c;
            converted += n;
        }
        if ("items" in row && Array.isArray(row.items)) {
            const [it, n] = iterateContent(row.items);
            row.items = it;
            converted += n;
        }

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
    return [out, converted];
}

export function convertMessageRows(rows: any[]): number {
    let converted = 0;
    for (const row of rows) {
        if (row?.type === 1 && row.message?.content) {
            const [content, n] = iterateContent(row.message.content);
            row.message.content = content;
            converted += n;
        }
    }
    return converted;
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
    const patcher = getPatcher();
    if (!patcher?.before || typeof patcher.before !== "function") return null;
    return patcher.before("updateRows", mod, (args: any[]) => {
        try {
            const rows = JSON.parse(args[1]);
            callback(rows);
            args[1] = JSON.stringify(rows);
        } catch (e: any) {
            console.error("[SystemEmojisEverywhere] rows:", e?.stack ?? e);
        }
    });
}
