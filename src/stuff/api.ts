import { getBunny, getVd } from "./env";

// Capa REST de Discord: token + fetch con manejo básico de errores.

let cachedToken: string | null = null;

export function getToken(): string | null {
    if (cachedToken) return cachedToken;
    try {
        const b: any = getBunny();
        const v: any = getVd();
        const mod =
            b?.metro?.findByProps?.("getToken")
            ?? v?.metro?.findByProps?.("getToken");
        const t = mod?.getToken?.();
        if (typeof t === "string" && t.length > 10) {
            cachedToken = t;
            return t;
        }
    } catch {}
    return null;
}

const API_BASE = "https://discord.com/api/v9";

export async function apiGet(path: string): Promise<any | null> {
    try {
        const token = getToken();
        if (!token) return null;
        const r = await fetch(API_BASE + path, {
            method: "GET",
            headers: { Authorization: token },
        });
        if (!r.ok) return null;
        return await r.json();
    } catch {
        return null;
    }
}

export async function apiPost(
    path: string,
    body: any,
): Promise<{ ok: boolean; status: number; data: any }> {
    const fallback = { ok: false, status: 0, data: null as any };
    try {
        const token = getToken();
        if (!token) return fallback;
        const r = await fetch(API_BASE + path, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body ?? {}),
        });
        let data: any = null;
        try {
            data = await r.json();
        } catch {}
        return { ok: r.ok, status: r.status, data };
    } catch {
        return fallback;
    }
}
