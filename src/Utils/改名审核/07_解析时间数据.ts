export function 解析改名时间戳(
    上次改名日期: string | null | undefined
): number | null {
    const 文本 = 上次改名日期?.trim();
    if (!文本) return null;

    const 格式匹配 = 文本.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{1,2})$/);
    if (格式匹配) {
        const [, 年, 月, 日, 时] = 格式匹配;
        const 时间戳 = new Date(
            Number(年),
            Number(月) - 1,
            Number(日),
            Number(时)
        ).getTime();
        return Number.isNaN(时间戳) ? null : 时间戳;
    }

    const 回退时间戳 = Date.parse(文本);
    return Number.isNaN(回退时间戳) ? null : 回退时间戳;
}
