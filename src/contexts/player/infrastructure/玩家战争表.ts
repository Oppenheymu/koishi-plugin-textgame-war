import type { Context } from "koishi";
import { 装备数量列字段 } from "#/infrastructure";

export function 加载玩家战争表(ctx: Context) {
    ctx.model.extend(
        "征战玩家战争表",
        {
            id: {
                type: "unsigned",
            },

            // 混淆后的ID
            uid: {
                type: "string",
                length: 255,
            },

            // 27 种装备数量列（陆军/空军/弹药，与军队表共享字段定义）
            ...装备数量列字段,

            // 空军状态机
            巡航中的预警机: {
                type: "unsigned",
                initial: 0,
            },
            巡航中的战斗机: {
                type: "unsigned",
                initial: 0,
            },

            // 地堡相关
            地下工厂投入: {
                type: "unsigned",
                initial: 0,
            },
            是否有地下工厂: {
                type: "boolean",
                initial: false,
            },
            地下机库投入: {
                type: "unsigned",
                initial: 0,
            },
            是否有地下机库: {
                type: "boolean",
                initial: false,
            },
            地下弹药库投入: {
                type: "unsigned",
                initial: 0,
            },
            是否有地下弹药库: {
                type: "boolean",
                initial: false,
            },

            // 地下机库相关
            地下侦察机: {
                type: "unsigned",
                initial: 0,
            },
            地下战斗机: {
                type: "unsigned",
                initial: 0,
            },
            地下预警机: {
                type: "unsigned",
                initial: 0,
            },
            地下战术轰炸机: {
                type: "unsigned",
                initial: 0,
            },
            地下战略轰炸机: {
                type: "unsigned",
                initial: 0,
            },
            地下隐形轰炸机: {
                type: "unsigned",
                initial: 0,
            },
            地下大型运输机: {
                type: "unsigned",
                initial: 0,
            },
            地下小型运输机: {
                type: "unsigned",
                initial: 0,
            },

            // 地下弹药库相关
            地下火箭弹: {
                type: "unsigned",
                initial: 0,
            },
            地下防空弹药: {
                type: "unsigned",
                initial: 0,
            },
        },
        {
            // 表配置
            primary: "id",
            unique: ["uid"],
        },
    );
}
