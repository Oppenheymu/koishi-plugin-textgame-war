import type { Context } from "koishi";
import { 格式化 } from "#/utils";
import type { Player, PlayerWarData } from "../../../types/index.js";
import { 更新玩家资料, 玩家检查 } from "../../../utils/index.js";

interface 地堡配置 {
    name: string;
    投入字段: keyof PlayerWarData;
    完成字段: keyof PlayerWarData;
    需求生产力: number;
}

const 地堡库: Record<string, 地堡配置> = {
    地下工厂: {
        name: "地下工厂",
        投入字段: "地下工厂投入",
        完成字段: "是否有地下工厂",
        需求生产力: 20000000,
    },
    地下机库: {
        name: "地下机库",
        投入字段: "地下机库投入",
        完成字段: "是否有地下机库",
        需求生产力: 10000000,
    },
    地下弹药库: {
        name: "地下弹药库",
        投入字段: "地下弹药库投入",
        完成字段: "是否有地下弹药库",
        需求生产力: 2000000,
    },
};

export function 修建地堡(ctx: Context) {
    ctx.command("修建地堡 <地堡类型>")
        .alias("建造地堡")
        .action(async ({ session }, 地堡类型) => {
            try {
                const { id, username, 用户资料 } = await 玩家检查(ctx, session);

                if (!地堡类型) {
                    return `
====[地堡建设]====
□格式：修建地堡 <类型>
□支持：${Object.keys(地堡库).join("/")}
□地下工厂：2000万生产力
□地下机库：1000万生产力
□地下弹药库：200万生产力`.trim();
                }

                const 配置 = 地堡库[地堡类型];
                if (!配置) return `地堡类型不存在。支持：${Object.keys(地堡库).join("/")}`;

                // 检查是否已完成
                if (用户资料[配置.完成字段] as boolean) {
                    return `${配置.name}已建造完毕`;
                }

                // 获取现有生产力投入
                const 已投入 = 用户资料[配置.投入字段] as number;
                const 当前生产力 = 用户资料.工人 * 用户资料.生产技术;
                const 工资 = 用户资料.工人 * 用户资料.工人工资;

                if (当前生产力 <= 0) {
                    return `生产力为零`;
                }

                if (工资 > 用户资料.生活资料) {
                    return `生活资料不足，无法支付工人工资`;
                }

                // 计算还需要多少投入
                const 剩余投入 = 配置.需求生产力 - 已投入;
                const 实际投入 = Math.min(当前生产力, 剩余投入);
                const 新投入 = 已投入 + 实际投入;
                const 进度百分比 = (新投入 / 配置.需求生产力) * 100;

                // 更新对象
                const 更新对象: Partial<Player & PlayerWarData> = {
                    [配置.投入字段]: 新投入,
                    生活资料: 用户资料.生活资料 - 工资,
                    生产次数: 用户资料.生产次数 - 1,
                };

                // 如果完成，设置完成标志
                if (新投入 >= 配置.需求生产力) {
                    Object.assign(更新对象, {
                        [配置.完成字段]: true,
                    });
                }

                await 更新玩家资料(ctx, id, 更新对象);

                const 完成提示 =
                    新投入 >= 配置.需求生产力 ? "✓已完成" : `${进度百分比.toFixed(2)}%`;

                return `
====[地堡建设]====
${username} 同志：
□ 类型：${配置.name}
□ 投入生产力：${格式化(实际投入)}
□ 消耗工资：${格式化(工资)}
□ 累计投入：${格式化(已投入)} → ${格式化(新投入)}
□ 状态：${完成提示}`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
