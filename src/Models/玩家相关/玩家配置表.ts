import { Context } from "koishi";

export function 加载玩家配置表(ctx: Context) {
    ctx.model.extend(
        "马列玩家配置表",
        {
            id: { type: "unsigned" },
            // 混淆后的ID
            uid: { type: "string", length: 255 },

            // 第三方平台ID
            onebot: { type: "string", length: 255, nullable: true },
            discord: { type: "string", length: 255, nullable: true },
            telegram: { type: "string", length: 255, nullable: true },

            // 昵称
            username: { type: "string", length: 255 },
            名称是否审核: { type: "boolean", initial: false },
            上次改名日期: { type: "string", nullable: true },
        },
        {
            // 表配置
            primary: "id",
            unique: ["uid"],
            autoInc: true,
        }
    );
}
