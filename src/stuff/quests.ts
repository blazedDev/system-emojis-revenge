import { getBunny, getVd } from "./env";
import { apiPost } from "./api";

// Modelo de misiones de Discord (solo las relevantes en móvil).

export const SUPPORTED = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"];

export type QuestInfo = {
    id: string;
    name: string;
    taskName: string;
    secondsNeeded: number;
    secondsDone: number;
    expiresAt: string;
    supported: boolean;
    raw: any;
};

function findQuestsStore(): any {
    try {
        const b: any = getBunny();
        const v: any = getVd();
        const store =
            b?.metro?.findByProps?.("getQuest")
            ?? v?.metro?.findByProps?.("getQuest");
        return store ?? null;
    } catch {
        return null;
    }
}

export function listQuests(): QuestInfo[] {
    const out: QuestInfo[] = [];
    try {
        const store: any = findQuestsStore();
        const map = store?.quests;
        if (!map || typeof map.values !== "function") return out;

        for (const q of map.values()) {
            try {
                if (!q?.userStatus?.enrolledAt) continue;
                if (q.userStatus?.completedAt) continue;
                if (new Date(q.config?.expiresAt).getTime() <= Date.now()) continue;

                const taskConfig = q.config?.taskConfig ?? q.config?.taskConfigV2;
                if (!taskConfig?.tasks) continue;
                const allTasks = Object.keys(taskConfig.tasks);
                const taskName =
                    SUPPORTED.find(t => allTasks.includes(t))
                    ?? allTasks[0];
                if (!taskName) continue;

                const taskData = taskConfig.tasks[taskName];
                out.push({
                    id: q.id,
                    name: q.config?.messages?.questName ?? q.id,
                    taskName,
                    secondsNeeded: taskData?.target ?? 0,
                    secondsDone:
                        q.userStatus?.progress?.[taskName]?.value ?? 0,
                    expiresAt: q.config?.expiresAt ?? "",
                    supported: SUPPORTED.includes(taskName),
                    raw: q,
                });
            } catch {}
        }
    } catch {}
    return out;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Completa una misión de video. Intento instantáneo (?force=true); si el
// servidor lo rechaza, cae a un envío real por pasos de 7 segundos.
export async function completeVideoQuest(
    quest: QuestInfo,
    onProgress?: (done: number, needed: number) => void,
): Promise<{ ok: boolean; instant: boolean; error?: string }> {
    if (!quest.supported) return { ok: false, instant: false, error: "no soportada en móvil" };

    let done = Math.min(quest.secondsDone, quest.secondsNeeded);
    const target = quest.secondsNeeded;

    onProgress?.(done, target);

    // 1) intento inmediato
    const fast = await apiPost(
        `/quests/${quest.id}/video-progress?force=true`,
        { timestamp: target },
    );
    if (fast.ok && fast.data?.completed_at != null) {
        onProgress?.(target, target);
        return { ok: true, instant: true };
    }

    // 2) paced
    let completedAt = null as any;
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
        const last = await apiPost(`/quests/${quest.id}/video-progress`, {
            timestamp: target,
        });
        completedAt = last.data?.completed_at ?? null;
    }

    onProgress?.(done, target);
    return completedAt != null
        ? { ok: true, instant: false }
        : { ok: false, instant: false, error: "el servidor no confirmó la finalización" };
}
