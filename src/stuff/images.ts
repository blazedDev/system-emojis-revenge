import { React, ReactNative as RN } from "@vendetta/metro/common";
import { uriToEmoji } from "./emoji";

export function installImagePatch(): () => void {
    const OrigImage: any = (RN as any).Image;
    const OrigText: any = (RN as any).Text;

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
        return () => {};
    }

    return () => {
        try {
            (RN as any).Image = OrigImage;
        } catch {}
    };
}
