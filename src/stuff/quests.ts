import { getBunny, getVd } from "./env";
import { apiPost } from "./api";

// Modelo completo de misiones de Discord por REST puro.
// Formatos verificados vía HAR del cliente oficial (Masterain98/discord-quest-helper):
//  - juego:        POST /quests/{id}/heartbeat {application_id, terminal}   c/60s
//  - stream:       POST /quests/{id}/heartbeat {stream_key, terminal}       c/30s
//  - actividad:    POST /quests/{id}/heartbeat {stream_key, terminal}       c/20s
//  - video:        POST /quests/{id}/video-progress {timestamp}             c/7s
//  - aceptar:      POST /quests/{id}/enroll {location:11,...}
//  - reclamar:     POST /quests/{id}/claim-reward {}

export const VIDEO_TASKS = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"];
export const GAME_TASKS = ["PLAY_ON_DESKTOP"];
export const STREAM_TASKS = ["STREAM_ON_DESKTOP"];
export const ACTIVITY_TASKS = ["PLAY_ACTIVITY"];
const ALL_KNOWN = [...VIDEO_TASKS, ...GAME_TASKS, ...STREAM_TASKS, ...ACTIVITY_TASKS];

export type QuestKind = "video" | "game" | "stream" | "activity" | "unknown";

export type QuestInfo = {
    id: string;
    name: string;
    taskName: string;
    kind: QuestKind;
    secondsNeeded: number;
    secondsDone: number;
    appId: string | null;
    expiresAt: string;
    runnable: boolean;
    blockedUntil: number | null;
    enrolled: boolean;
    raw: any;
};

function findModule(props: string[]): any {
    try {
        const b: any = getBunny();
        const v: any = getVd();
        return (
            b?.metro?.findByProps?.(...props)
            ?? v?.metro?.findByProps?.(...props)
            ?? null
        );
    } catch {
        return null;
    }
}

function resolveTask(q: any): { name: string; data: any } | null {
    const tc = q.config?.taskConfig ?? q.config?.taskConfigV2;
    if (!tc?.tasks) return null;
    for (const k of ALL_KNOWN) {
        if (tc.tasks[k] != null) return { name: k, data: tc.tasks[k] };
    }
    const keys = Object.keys(tc.tasks);
    return keys.length ? { name: keys[0], data: tc.tasks[keys[0]] } : null;
}

function resolveAppId(q: any, taskData: any): string | null {
    // julio 2026: el id se movió a tasks.<KEY>.applications[0].id
    const modern = taskData?.applications?.[0]?.id;
    if (modern != null) return String(modern);
    const legacy = q.config?.application?.id;
    return legacy != null ? String(legacy) : null;
}

function kindOf(taskName: string): QuestKind {
    if (VIDEO_TASKS.includes(taskName)) return "video";
    if (GAME_TASKS.includes(taskName)) return "game";
    if (STREAM_TASKS.includes(taskName)) return "stream";
    if (ACTIVITY_TASKS.includes(taskName)) return "activity";
    return "unknown";
}

function blockedUntilOf(q: any): number | null {
    const v =
        q.userStatus?.quest_enrollment_blocked_until
        ?? q.quest_enrollment_blocked_until;
    if (v == null) return null;
    const t = typeof v === "number" ? v : new Date(v).getTime();
    return isNaN(t) ? null : t;
}

export function listQuests(): QuestInfo[] {
    const out: QuestInfo[] = [];
    const store: any = findModule(["getQuest"]);
    const map = store?.quests;
    if (!map || typeof map.values !== "function") return out;

    for (const q of map.values()) {
        try {
            if (!q?.config || new Date(q.config?.expiresAt).getTime() <= Date.now()) continue;
            const task = resolveTask(q);
            if (!task) continue;
            const enrolled = !!q.userStatus?.enrolledAt;
            if (!enrolled && q.userStatus?.completedAt) continue;

            out.push({
                id: q.id,
                name: q.config?.messages?.questName ?? q.id,
                taskName: task.name,
                kind: kindOf(task.name),
                secondsNeeded: task.data?.target ?? 0,
                secondsDone: q.userStatus?.progress?.[task.name]?.value ?? 0,
                appId: resolveAppId(q, task.data),
                expiresAt: q.config?.expiresAt ?? "",
                runnable: kindOf(task.name) !== "unknown",
                blockedUntil: blockedUntilOf(q),
                enrolled,
                raw: q,
            });
        } catch {}
    }
    return out;
}

// canal para stream_key (formato real: call:<channelId>:<ownerId>)
let cachedChannelId: string | null = null;
function getChannelId(): string | null {
    if (cachedChannelId) return cachedChannelId;
    try {
        const dm: any = findModule(["getSortedPrivateChannels"]);
        const ch = dm?.getSortedPrivateChannels?.()[0]?.id;
        if (ch != null) {
            cachedChannelId = String(ch);
            return cachedChannelId;
        }
        const gs: any = findModule(["getAllGuilds"]);
        const guilds = gs?.getAllGuilds?.() ?? {};
        for (const g of Object.values<any>(guilds)) {
            const voc = (g as any)?.VOCAL?.[0]?.channel?.id ?? (g as any)?.VOCAL?.[0]?.id;
            if (voc != null) {
                cachedChannelId = String(voc);
                return cachedChannelId;
            }
        }
    } catch {}
    return null;
}

function makeStreamKey(userId: string): string | null {
    const ch = getChannelId();
    if (ch == null) return null;
    return `call:${ch}:${userId}`;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const rand = (n: number) => Math.floor(Math.random() * n);
const alnum = () => {
    const s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let o = "";
    for (let i = 0; i < 32; i++) o += s[rand(s.length)];
    return o;
};

export type RunResult = { ok: boolean; error?: string };

type ProgressCb = (done: number, needed: number) => void;

// --- video ---
export async function completeVideoQuest(
    quest: QuestInfo,
    onProgress?: ProgressCb,
): Promise<RunResult> {
    let done = Math.min(quest.secondsDone, quest.secondsNeeded);
    const target = quest.secondsNeeded;
    onProgress?.(done, target);

    const fast = await apiPost(`/quests/${quest.id}/video-progress?force=true`, { timestamp: target });
    if (fast.ok && fast.data?.completed_at != null) {
        onProgress?.(target, target);
        return { ok: true };
    }

    let completedAt: any = null;
    while (done < target) {
        await sleep(7000);
        const timestamp = Math.min(target, done + 7);
        const res = await apiPost(`/quests/${quest.id}/video-progress`, {
            timestamp: Math.min(target, timestamp + Math.random()),
        });
        if (res.ok && res.data?.completed_at != null) {
            completedAt = res.data.completed_at;
            done = target;
            break;
        }
        done = Math.min(target, timestamp);
        onProgress?.(done, target);
    }

    if (completedAt == null && done >= target) {
        const last = await apiPost(`/quests/${quest.id}/video-progress`, { timestamp: target });
        completedAt = last.data?.completed_at ?? null;
    }
    onProgress?.(done, target);
    return completedAt != null ? { ok: true } : { ok: false, error: "el servidor no confirmó" };
}

// --- heartbeat genérico (juego / stream / actividad) ---
async function completeHeartbeatQuest(
    quest: QuestInfo,
    intervalSec: number,
    buildBody: (terminal: boolean) => any,
    onProgress?: ProgressCb,
): Promise<RunResult> {
    let done = Math.min(quest.secondsDone, quest.secondsNeeded);
    const target = quest.secondsNeeded;
    onProgress?.(done, target);

    let silentBeats = 0;
    while (done < target) {
        await sleep(intervalSec * 1000);
        const isLast = done + intervalSec >= target;
        const res = await apiPost(`/quests/${quest.id}/heartbeat`, buildBody(isLast));
        if (!res.ok) {
            silentBeats++;
            if (silentBeats >= 5) return { ok: false, error: `heartbeat rechazado (${res.status})` };
        } else {
            silentBeats = 0;
            if (res.data?.completed_at != null) {
                onProgress?.(target, target);
                return { ok: true };
            }
            const p = Number(res.data?.progress?.[quest.taskName]?.value);
            if (!isNaN(p) && p > 0) {
                done = Math.max(done, Math.min(p, target));
                onProgress?.(done, target);
                continue;
            }
            if (res.data?.progress == null && isLast) {
                // sin progreso ni confirmación: no inventamos avance
                silentBeats++;
                if (silentBeats >= 5) return { ok: false, error: "el servidor no acredita progreso" };
            }
        }
        done = Math.min(target, done + intervalSec);
        onProgress?.(done, target);
    }

    await apiPost(`/quests/${quest.id}/heartbeat`, buildBody(true));
    return { ok: true };
}

export async function completeGameQuest(q: QuestInfo, onProgress?: ProgressCb): Promise<RunResult> {
    if (!q.appId) return { ok: false, error: "sin application_id en la misión" };
    return completeHeartbeatQuest(q, 60, terminal => ({ application_id: q.appId, terminal }), onProgress);
}

export async function completeStreamOrActivityQuest(
    q: QuestInfo,
    userId: string,
    onProgress?: ProgressCb,
): Promise<RunResult> {
    const key = makeStreamKey(userId) ?? `stream_${alnum()}`;
    const interval = q.kind === "activity" ? 20 : 30;
    return completeHeartbeatQuest(q, interval, terminal => ({ stream_key: key, terminal }), onProgress);
}

// --- aceptar misiones nuevas ---
export async function enrollQuest(questId: string): Promise<{ ok: boolean; error?: string }> {
    const full = await apiPost(
        `/quests/${questId}/enroll`,
        { location: 11, is_targeted: false, metadata_raw: null },
    );
    if (full.ok) return { ok: true };
    const minimal = await apiPost(`/quests/${questId}/enroll`, { location: 11 });
    return minimal.ok ? { ok: true } : { ok: false, error: `enroll falló (${minimal.status})` };
}

// --- reclamar recompensa ---
export async function claimReward(questId: string): Promise<{ ok: boolean; error?: string }> {
    const r = await apiPost(`/quests/${questId}/claim-reward`, {});
    if (r.ok) return { ok: true };
    return { ok: false, error: `claim falló (${r.status})${r.status === 400 ? " — probablemente pide captcha, reclamá manual" : ""}` };
}

export function dispatchQuests(): QuestInfo[] {
    return listQuests().filter(q => !q.enrolled && q.runnable);
}

export { getChannelId };
