import { Context } from "koishi";
import { 玩家检查 } from "../../../Utils";
import { Player } from "../../../Types";

interface 物资配置 {
    name: string;
    字段: keyof Player;
    地堡: keyof Player;
    地下字段: keyof Player;
}

const 物资库: Record<string, 物资配置> = {
    工人: {
        name: "工人",
        字段: "工人",
        地堡: "是否有地下工厂",
        地下字段: "地下工人",
    },
    飞机: {
        name: "飞机",
        字段: "轰炸机",
        地堡: "是否有地下机库",
        地下字段: "地下飞机",
    },
    隐形飞机: {
        name: "隐形飞机",
        字段: "隐形轰炸机",
        地堡: "是否有地下机库",
        地下字段: "地下隐形飞机",
    },
    预警机: {
        name: "预警机",
        字段: "预警机",
        地堡: "是否有地下机库",
        地下字段: "地下预警机",
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
        字段: "火箭炮弹药",
        地堡: "是否有地下弹药库",
        地下字段: "地下火箭炮炮弹",
    },
};

export function 转入地面(ctx: Context) {
    ctx.command("转入地面 <物资> <数量:number>").action(
        async ({ session }, 物资, 数量) => {
            try {
                const { id, username, 用户资料 } = await 玩家检查(ctx, session);
                const 格式化 = (n: number) => n.toLocaleString("zh-CN");

                if (!物资 || !数量) {
                    return `
====[工业生产]====
□格式：转入地面 物资 数量
□示例：转入地面 工人 100
□物资：${Object.keys(物资库).join("/")}`.trim();
                }

                if (数量 <= 0 || !Number.isInteger(数量)) {
                    return `请输入正确的数量`;
                }

                const 配置 = 物资库[物资];
                if (!配置)
                    return `物资不存在。支持：${Object.keys(物资库).join("/")}`;

                // 获取地下数值
                const 地下数值 = 用户资料[配置.地下字段] as number;
                if (数量 > 地下数值) {
                    return `地下${配置.name}不足！当前：${格式化(地下数值)}`;
                }

                // 转出到地面
                const 地面数值 = 用户资料[配置.字段] as number;

                await ctx.database.set(
                    "马列玩家表",
                    { id },
                    {
                        [配置.地下字段]: 地下数值 - 数量,
                        [配置.字段]: 地面数值 + 数量,
                    },
                );

                return `
====[工业生产]====
成功转入地面
■ ${配置.name}：${格式化(地面数值)} → ${格式化(地面数值 + 数量)}`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        },
    );
}
