// 查看战斗指令
import dayjs from "dayjs";
import type { Context } from "koishi";
import { 战斗状态, 加载联军名称缓存 } from "#ctx/military";
import { 玩家检查 } from "#ctx/player";
import { 获取用户名缓存 } from "./共用.js";

export function 查看战斗(ctx: Context) {
    ctx.command("查看战斗 <地区编号:string>").action(async ({ session }, 地区编号) => {
        try {
            await 玩家检查(ctx, session);
            const 编号 = 地区编号?.trim();
            if (!编号) return "请指定地区编号";

            const [战斗] = await ctx.database.get("征战战斗表", {
                地区编号: 编号,
                状态: 战斗状态.进行中,
            });
            if (!战斗) {
                return `${编号} 地区当前没有进行中的战斗`;
            }

            const 参战军队 = await ctx.database.get("征战军队表", {
                当前战斗编号: 战斗.id,
            });
            const 用户名缓存 = await 获取用户名缓存(
                ctx,
                参战军队.map((a) => a.指挥官UID),
            );
            const 名称缓存 = await 加载联军名称缓存(ctx, [
                战斗.进攻方联军编号,
                战斗.防守方联军编号,
            ]);

            const 格式化一方 = (阵营: string) =>
                参战军队
                    .filter((a) => a.战斗阵营 === 阵营)
                    .map((军队) => {
                        const 指挥官 = 军队.指挥官UID
                            ? (用户名缓存.get(军队.指挥官UID) ?? "未知")
                            : "无主";
                        return `  ■ #${军队.id} 第${军队.番号}军（${指挥官}）组织度 ${(军队.当前组织度比例 * 100).toFixed(0)}%`;
                    })
                    .join("\n") || "  （无）";

            return [
                `====[${编号}地区 战斗概况]====`,
                `■ 回合数：${战斗.回合数}`,
                `■ 开始时间：${dayjs(战斗.开始时间).format("MM-DD HH:mm")}`,
                `---- 进攻方（${名称缓存.get(战斗.进攻方联军编号)}）----`,
                格式化一方("进攻"),
                `---- 防守方（${名称缓存.get(战斗.防守方联军编号)}）----`,
                格式化一方("防守"),
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}
