import { Context } from "koishi";

/**
 * 初始化玩家数据表
 */
export function 加载玩家表(ctx: Context) {
    ctx.model.extend(
        "马列玩家表",
        {
            id: { type: "unsigned" },
            // 混淆后的ID
            uid: { type: "string", length: 255 },

            //状态机
            所在联军: {
                type: "string",
                length: 255,
                initial: null,
                nullable: true,
            },
            驻扎地区: {
                type: "string",
                length: 255,
                initial: null,
                nullable: true,
            },
            战争保护期: { type: "integer", initial: null, nullable: true },
            小时是否生产: { type: "boolean", initial: false },
            今日是否签到: { type: "boolean", initial: false },

            //状态
            稳定度: { type: "unsigned", initial: 80 },
            生产次数: { type: "unsigned", initial: 0 },
            工人工资: { type: "unsigned", initial: 0 },
            工人招募限额: { type: "unsigned", initial: 1000 },

            // 全部资料
            生活资料: { type: "unsigned", initial: 0 },
            生产技术: { type: "unsigned", initial: 10 },
            厂房: { type: "unsigned", initial: 0 },
            工人: { type: "unsigned", initial: 0 },
            地下工人: { type: "unsigned", initial: 0 },
            休假工人: { type: "unsigned", initial: 0 },

            // 科技相关
            科技等级: { type: "unsigned", initial: 1 },
            科技蓝图: { type: "unsigned", initial: 0 },
            科技池投入: { type: "unsigned", initial: 0 },
            科技池容量: { type: "unsigned", initial: 5000 },

            // 资源
            石油: { type: "unsigned", initial: 0 },
            铝土矿: { type: "unsigned", initial: 0 },
            金属铝: { type: "unsigned", initial: 0 },
            铁矿石: { type: "unsigned", initial: 0 },
            钢铁: { type: "unsigned", initial: 0 },

            // 陆军
            私人军队: { type: "unsigned", initial: 0 },
            重炮: { type: "unsigned", initial: 0 },
            火箭炮: { type: "unsigned", initial: 0 },
            火箭炮弹药: { type: "unsigned", initial: 0 },

            // 空军（地面/正常状态）
            防空弹药: { type: "unsigned", initial: 0 },
            侦察机: { type: "unsigned", initial: 0 },
            轰炸机: { type: "unsigned", initial: 0 },
            隐形轰炸机: { type: "unsigned", initial: 0 },
            大型运输机: { type: "unsigned", initial: 0 },
            小型运输机: { type: "unsigned", initial: 0 },
            预警机: { type: "unsigned", initial: 0 },
            巡航中的预警机: { type: "unsigned", initial: 0 },
            战斗机: { type: "unsigned", initial: 0 },
            巡航中的战斗机: { type: "unsigned", initial: 0 },

            地下工厂投入: { type: "unsigned", initial: 0 },
            是否有地下工厂: { type: "boolean", initial: false },
            地下机库投入: { type: "unsigned", initial: 0 },
            是否有地下机库: { type: "boolean", initial: false },
            地下弹药库投入: { type: "unsigned", initial: 0 },
            是否有地下弹药库: { type: "boolean", initial: false },

            // 地下机库相关
            地下飞机: { type: "unsigned", initial: 0 },
            地下隐形飞机: { type: "unsigned", initial: 0 },
            地下预警机: { type: "unsigned", initial: 0 },
            地下大型运输机: { type: "unsigned", initial: 0 },
            地下小型运输机: { type: "unsigned", initial: 0 },

            // 地下弹药库相关
            地下火箭炮炮弹: { type: "unsigned", initial: 0 },
            地下防空弹药: { type: "unsigned", initial: 0 },
        },
        {
            // 表配置
            primary: "id",
            unique: ["uid"],
        },
    );
}
