export const IGNORE_CHARS_RE =
    /[\u200B-\u200D\uFEFF\p{White_Space}\p{P}\p{S}_]+/gu;

export const norm = (s: string) =>
    s.normalize("NFKC").toLowerCase().replace(IGNORE_CHARS_RE, "");
