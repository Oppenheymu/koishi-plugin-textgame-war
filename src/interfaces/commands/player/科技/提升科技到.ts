import type { Context } from "koishi";
import { 玩家检查 } from "#ctx/player";
import { 格式化 } from "#shared/format";

export function 提升科技到(ctx: Context) {
    ctx.command("提升科技到 <目标等级:number>").action(async ({ session }, 目标等级) => {
        try {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示

            // 验证输入
            if (!目标等级 || 目标等级 <= 0 || !Number.isInteger(目标等级)) {
                return "请输入有效的目标等级！\n例如：提升科技到 100";
            }

            const 当前等级 = 用户资料.科技等级;

            // 检查目标等级是否有效
            if (目标等级 > 3000) {
                return `目标等级不能超过3000！当前上限：3000级`;
            }

            if (目标等级 <= 当前等级) {
                return `目标等级必须高于当前等级！当前：${当前等级}级`;
            }

            // 计算所需的总生活资料
            let 所需生活资料 = 0;
            for (let i = 当前等级; i < 目标等级; i++) {
                所需生活资料 += 5000 * i;
            }

            // 加上当前科技池中还未投入的容量
            const 科技池还需投入 = 用户资料.科技池容量 - 用户资料.科技池投入;
            所需生活资料 += 科技池还需投入;

            // 检查生活资料是否足够
            if (用户资料.生活资料 < 所需生活资料) {
                const 还差 = 所需生活资料 - 用户资料.生活资料;
                return `生活资料不足！需要：${格式化(所需生活资料)}，还差：${格式化(还差)}`;
            }

            // 扣除生活资料
            const 减少后的生活资料 = 用户资料.生活资料 - 所需生活资料;
            const 新科技池容量 = 目标等级 < 3000 ? 5000 * 目标等级 : 0;

            // 更新数据库
            await ctx.database.set(
                "征战玩家表",
                {
                    id: id,
                },
                {
                    生活资料: 减少后的生活资料,
                    科技池投入: 0,
                    科技等级: 目标等级,
                    科技池容量: 新科技池容量,
                },
            );

            // 构建返回信息
            const 升级等级数 = 目标等级 - 当前等级;

            const 返回信息 = `
===[征战文游]===
${username} 同志：
成功投入科技生产
■科技级别：${当前等级}→${目标等级} (+${升级等级数}级)
■生活资料：${格式化(减少后的生活资料)} (-${格式化(所需生活资料)})`;

            return 返回信息.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
