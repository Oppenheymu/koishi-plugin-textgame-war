import { Context } from "koishi";

export function 加载玩家战争表(ctx: Context) {
    ctx.model.extend(
        "马列玩家战争表",
        {
            id: { type: "unsigned" },
            // 混淆后的ID
            uid: { type: "string", length: 255 },
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

            // 地堡相关
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
        }
    );
}
