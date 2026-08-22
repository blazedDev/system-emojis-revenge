const TEXT_DEFAULT =
    "[\\u00A9\\u00AE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u21AA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u3030\\u303D\\u3297\\u3299]";

const CORE = `(?:[#*0-9]\\uFE0F?\\u20E3|${TEXT_DEFAULT}\\uFE0F|\\p{Extended_Pictographic})(?:\\p{Emoji_Modifier}|\\uFE0F)?`;

const SEQUENCE = `${CORE}(?:\\u200D${CORE})*`;
const FLAGS = "\\p{Regional_Indicator}\\p{Regional_Indicator}";

export const EMOJI_SOURCE = `(?:${FLAGS}|${SEQUENCE})`;

export const EMOJI_RE = new RegExp(EMOJI_SOURCE, "gu");

export function isEmojiChar(text: string): boolean {
    if (!text) return false;
    EMOJI_RE.lastIndex = 0;
    const m = EMOJI_RE.exec(text);
    return !!m && m[0] === text && m[0].length === text.length;
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
