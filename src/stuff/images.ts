import { React, ReactNative as RN } from "@vendetta/metro/common";
import { uriToEmoji } from "./emoji";

export function installImagePatch(): { unwind: () => void; ok: boolean } {
    const OrigImage: any = (RN as any).Image;
    const OrigText: any = (RN as any).Text;

    if (!OrigImage || typeof OrigImage !== "function" && typeof OrigImage !== "object") {
        return { unwind: () => {}, ok: false };
    }

    const wrapper = function EmojiAwareImage(props: any) {
        const emoji = uriToEmoji(props?.source?.uri);
        if (emoji) {
            return React.createElement(
                OrigText ?? "View",
                props?.style ? { style: props.style, children: emoji } : { children: emoji },
            );
        }
        return React.createElement(OrigImage, props);
    };

    try {
        for (const key of Object.keys(OrigImage ?? {})) {
            try {
                Object.defineProperty(wrapper, key, Object.getOwnPropertyDescriptor(OrigImage, key)!);
            } catch {}
        }
        (RN as any).Image = wrapper;
    } catch (e: any) {
        console.error("[SystemEmojisEverywhere] no se pudo parchear RN.Image:", e?.message);
        return { unwind: () => {}, ok: false };
    }

    return {
        unwind: () => {
            try {
                (RN as any).Image = OrigImage;
            } catch {}
        },
        ok: true,
    };
}
