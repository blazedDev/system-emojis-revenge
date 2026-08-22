import emojiRegex from "emoji-regex";

const EMOJI_RE = emojiRegex();

export function isEmojiChar(text: string): boolean {
    if (!text) return false;
    const m = EMOJI_RE.exec(text);
    return !!m && m[0] === text;
}

export function fromCodePoints(cps: string[]): string {
    try {
        return String.fromCodePoint(...cps.map(c => Number.parseInt(c, 16)));
    } catch {
        return "";
    }
}

const HEX_TOKEN = /^[0-9a-f]{1,7}$/i;

const EMOJI_URI_HOSTS = new RegExp(
    "(?:^|//)(?:"
    + "cdn\\.discordapp\\.com/emojis/"
    + "|twemoji\\.maxcdn\\.com/"
    + "|cdn\\.jsdelivr\\.net/(?:gh/jdecked/twemoji@[^/]+/assets/|gh/twitter/twemoji@[^/]+/assets/)"
    + "|cdnjs\\.cloudflare\\.com/ajax/libs/twemoji/"
    + "|abs\\.twimg\\.com/emoji/v2/"
    + ")",
);

export function uriToEmoji(uri: unknown): string | null {
    if (typeof uri !== "string") return null;

    try {
        if (uri.startsWith("asset:/emoji-")) {
            const name = uri.slice("asset:/emoji-".length).replace(/\.(png|webp).*$/i, "");
            const emoji = fromCodePoints(name.split("-"));
            return isEmojiChar(emoji) ? emoji : null;
        }

        const path = uri.split("?")[0];
        if (!EMOJI_URI_HOSTS.test(path)) return null;

        const m = path.match(/([0-9a-f]+(?:-[0-9a-f]+)*)\.(?:png|svg)$/i);
        if (!m) return null;

        const cps = m[1].toLowerCase().split("-");
        if (!cps.every(t => HEX_TOKEN.test(t))) return null;

        const emoji = fromCodePoints(cps);
        return isEmojiChar(emoji) ? emoji : null;
    } catch {
        return null;
    }
}
