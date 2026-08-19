import type { Context } from "koishi";
import type { PlayerWarData } from "#ctx/player";
import { 更新玩家资料, 玩家检查 } from "#ctx/player";
import { 格式化 } from "#shared/format";
import type { 玩家完整资料 } from "#shared/kernel/跨域类型";

interface 物资配置 {
    name: string;
    字段: keyof 玩家完整资料;
    地堡: keyof PlayerWarData;
    地下字段: keyof 玩家完整资料;
}

const 物资库: Record<string, 物资配置> = {
    侦察机: {
        name: "侦察机",
        字段: "侦察机",
        地堡: "是否有地下机库",
        地下字段: "地下侦察机",
    },
    战斗机: {
        name: "战斗机",
        字段: "战斗机",
        地堡: "是否有地下机库",
        地下字段: "地下战斗机",
    },
    预警机: {
        name: "预警机",
        字段: "预警机",
        地堡: "是否有地下机库",
        地下字段: "地下预警机",
    },
    战术轰炸机: {
        name: "战术轰炸机",
        字段: "战术轰炸机",
        地堡: "是否有地下机库",
        地下字段: "地下战术轰炸机",
    },
    战略轰炸机: {
        name: "战略轰炸机",
        字段: "战略轰炸机",
        地堡: "是否有地下机库",
        地下字段: "地下战略轰炸机",
    },
    隐形轰炸机: {
        name: "隐形轰炸机",
        字段: "隐形轰炸机",
        地堡: "是否有地下机库",
        地下字段: "地下隐形轰炸机",
    },
    大型运输机: {
        name: "大型运输机",
        字段: "大型运输机",
        地堡: "是否有地下机库",
        地下字段: "地下大型运输机",
    },
    小型运输机: {
        name: "小型运输机",
        字段: "小型运输机",
        地堡: "是否有地下机库",
        地下字段: "地下小型运输机",
    },
    防空弹药: {
        name: "防空弹药",
        字段: "防空弹药",
        地堡: "是否有地下弹药库",
        地下字段: "地下防空弹药",
    },
    火箭弹: {
        name: "火箭弹",
        字段: "火箭弹",
        地堡: "是否有地下弹药库",
        地下字段: "地下火箭弹",
    },
};

export function 转移地堡物资(ctx: Context) {
    ctx.command("转入地面 <物资> <数量:number>").action(async ({ session }, 物资, 数量) => {
        try {
            const { id, 用户资料 } = await 玩家检查(ctx, session);

            if (!物资 || !数量) {
                return `
====[工业生产]====
□格式：转入地面 物资 数量
□示例：转入地面 战斗机 100
□物资：${Object.keys(物资库).join("/")}`.trim();
            }

            if (数量 <= 0 || !Number.isInteger(数量)) {
                return `请输入正确的数量`;
            }

            const 配置 = 物资库[物资];
            if (!配置) return `物资不存在。支持：${Object.keys(物资库).join("/")}`;

            // 获取地下数值
            const 地下数值 = 用户资料[配置.地下字段] as number;
            if (数量 > 地下数值) {
                return `地下${配置.name}不足！当前：${格式化(地下数值)}`;
            }

            // 转出到地面
            const 地面数值 = 用户资料[配置.字段] as number;

            await 更新玩家资料(ctx, id, {
                [配置.地下字段]: 地下数值 - 数量,
                [配置.字段]: 地面数值 + 数量,
            });

            return `
====[工业生产]====
成功转入地面
■ ${配置.name}：${格式化(地面数值)} → ${格式化(地面数值 + 数量)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });

    ctx.command("转入地下 <物资> <数量:number>").action(async ({ session }, 物资, 数量) => {
        try {
            const { id, 用户资料 } = await 玩家检查(ctx, session);

            if (!物资 || !数量) {
                return `
====[工业生产]====
□格式：转入地下 物资 数量
□示例：转入地下 战斗机 100
□物资：${Object.keys(物资库).join("/")}`.trim();
            }

            if (数量 <= 0 || !Number.isInteger(数量)) {
                return `请输入正确的数量`;
            }

            const 配置 = 物资库[物资];
            if (!配置) return `物资不存在。支持：${Object.keys(物资库).join("/")}`;

            // 检查地堡
            if (!(用户资料[配置.地堡] as boolean)) {
                return `地堡未建造，无法转入`;
            }

            // 获取源数值
            const 源数值 = 用户资料[配置.字段] as number;
            if (数量 > 源数值) {
                return `${配置.name}不足！当前：${格式化(源数值)}`;
            }

            // 转入地下
            const 目标数值 = 用户资料[配置.地下字段] as number;

            await 更新玩家资料(ctx, id, {
                [配置.字段]: 源数值 - 数量,
                [配置.地下字段]: 目标数值 + 数量,
            });

            return `
====[工业生产]====
成功转入地下
■ ${配置.name}：${格式化(源数值)} → ${格式化(源数值 - 数量)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
