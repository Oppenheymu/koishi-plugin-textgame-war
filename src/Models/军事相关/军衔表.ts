import type { Context } from "koishi";

/**
 * 联军军衔表：联军内一人一衔（唯一约束 [联军编号, 玩家UID]）
 * 双轨授衔：政治路（联军权限"授衔"）可授任意军衔；军事路（少将）仅可授/褫尉官
 */
export function 加载联军军衔表(ctx: Context) {
    ctx.model.extend(
        "马列联军军衔表",
        {
            id: {
                type: "unsigned",
            },
            联军编号: {
                type: "string",
                length: 255,
            },
            玩家UID: {
                type: "string",
                length: 255,
            },
            军衔: {
                type: "unsigned",
            },
            来源: {
                type: "string",
                length: 32,
            },
            授予者UID: {
                type: "string",
                length: 255,
            },
            授予时间: {
                type: "string",
                length: 255,
            },
        },
        {
            primary: "id",
            autoInc: true,
            unique: [["联军编号", "玩家UID"]],
        },
    );
}
