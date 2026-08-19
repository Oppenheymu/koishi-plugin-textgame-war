import type { Context } from "koishi";
import { 格式化 } from "#shared/format";
import { 玩家检查 } from "#ctx/player/domain/守卫";

export function 扩建厂房(ctx: Context) {
    ctx.command("扩建厂房 [数量:number]").action(async ({ session }, 数量) => {
        try {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示

            // 如果使用不带参数的形式，则扩建1000个空间
            const 扩建数量 = 数量 || 5000;
            const 扩建成本 = Math.ceil(扩建数量 / 5); // 每5个空间需要1钢铁

            // 检查钢铁是否足够
            if (用户资料.钢铁 < 扩建成本) {
                return `
【工业扩建】
${username} 同志：
□ 钢铁不足：（吨）
需要 ${格式化(扩建成本)}
□ 当前钢铁：${格式化(用户资料.钢铁)}
`.trim();
            }

            // 更新数据
            const 新厂房 = 用户资料.厂房 + 扩建数量;
            const 新钢铁 = 用户资料.钢铁 - 扩建成本;

            await ctx.database.set(
                "马列玩家表",
                {
                    id: id,
                },
                {
                    厂房: 新厂房,
                    钢铁: 新钢铁,
                },
            );

            return `
【工业扩建】
${username} 同志：
===扩建完成===
□ 厂房：${格式化(用户资料.厂房)} → ${格式化(新厂房)}
□ 钢铁：${格式化(用户资料.钢铁)} → ${格式化(新钢铁)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
