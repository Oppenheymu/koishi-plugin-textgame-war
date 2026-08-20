import type { Context } from "koishi";

/**
 * 初始化玩家数据表
 */
export function 加载玩家表(ctx: Context) {
    ctx.model.extend(
        "征战玩家表",
        {
            id: {
                type: "unsigned",
            },
            // 混淆后的ID
            uid: {
                type: "string",
                length: 255,
            },

            //状态机
            所在联军: {
                type: "string",
                length: 255,
                initial: null,
                nullable: true,
            },
            战争保护期: {
                type: "integer",
                initial: null,
                nullable: true,
            },
            曾加入联军列表: {
                type: "json",
                initial: [],
            },
            驻扎地区: {
                type: "string",
                length: 255,
                initial: null,
                nullable: true,
            },
            上次驻扎日期: {
                type: "string",
                nullable: true,
            },
            上次炮击时间: {
                type: "string",
                nullable: true,
            },

            小时是否生产: {
                type: "boolean",
                initial: false,
            },
            今日是否签到: {
                type: "boolean",
                initial: false,
            },

            //状态
            稳定度: {
                type: "unsigned",
                initial: 80,
            },
            生产次数: {
                type: "unsigned",
                initial: 0,
            },
            工人工资: {
                type: "unsigned",
                initial: 0,
            },
            工人招募限额: {
                type: "unsigned",
                initial: 1000,
            },

            // 全部资料
            生活资料: {
                type: "unsigned",
                initial: 0,
            },
            生产技术: {
                type: "unsigned",
                initial: 10,
            },
            厂房: {
                type: "unsigned",
                initial: 0,
            },
            工人: {
                type: "unsigned",
                initial: 0,
            },
            地下工人: {
                type: "unsigned",
                initial: 0,
            },
            休假工人: {
                type: "unsigned",
                initial: 0,
            },

            // 科技相关
            科技等级: {
                type: "unsigned",
                initial: 1,
            },
            科技蓝图: {
                type: "unsigned",
                initial: 0,
            },
            科技池投入: {
                type: "unsigned",
                initial: 0,
            },
            科技池容量: {
                type: "unsigned",
                initial: 5000,
            },

            // 资源
            石油: {
                type: "unsigned",
                initial: 0,
            },
            铝土矿: {
                type: "unsigned",
                initial: 0,
            },
            金属铝: {
                type: "unsigned",
                initial: 0,
            },
            铁矿石: {
                type: "unsigned",
                initial: 0,
            },
            钢铁: {
                type: "unsigned",
                initial: 0,
            },
            铀矿: {
                type: "unsigned",
                initial: 0,
            },

            // 战略
            浓缩铀: {
                type: "unsigned",
                initial: 0,
            },
            钚: {
                type: "unsigned",
                initial: 0,
            },
            生物武器: {
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
