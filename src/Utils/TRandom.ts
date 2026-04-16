/**
 * 生成服从三角分布的随机数
 * @param min    - 最小值 (下限)
 * @param mode   - 最可能值 (众数，峰值位置)
 * @param max    - 最大值 (上限)
 * @param round  - 是否取整到最近的整数，默认 true
 * @returns      - 随机数（整数或浮点数）
 */
export function TRandom(
	min: number,
	mode: number,
	max: number,
	round: boolean = true,
): number {
	if (min > mode || mode > max) {
		throw new Error("参数错误：必须满足 min ≤ mode ≤ max");
	}
	if (min === max) return min;

	const u = Math.random();
	const c = (mode - min) / (max - min); // F(mode)

	let result: number;

	if (u <= c) {
		// 左半边
		result = min + Math.sqrt(u * (max - min) * (mode - min));
	} else {
		// 右半边
		result = max - Math.sqrt((1 - u) * (max - min) * (max - mode));
	}

	// 根据 round 参数决定是否取整
	return round ? Math.round(result) : result;
}
