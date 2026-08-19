export function TRandom(min: number, mode: number, max: number, round: boolean = true): number {
    if (min > mode || mode > max) {
        throw new Error("参数错误：必须满足 min ≤ mode ≤ max");
    }
    if (min === max) return min;

    const u = Math.random();
    const c = (mode - min) / (max - min);

    let result: number;

    if (u <= c) {
        result = min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
        result = max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }

    return round ? Math.round(result) : result;
}
