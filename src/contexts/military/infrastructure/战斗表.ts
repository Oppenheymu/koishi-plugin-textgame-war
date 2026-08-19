import type { Context } from "koishi";
import { 战斗状态 } from "#ctx/military/domain/types/枚举";

/**
 * 战斗表：参与关系不落参与表，由 Army.当前战斗编号 + Army.战斗阵营 反查
 */
export function 加载战斗表(ctx: Context) {
    ctx.model.extend(
        "马列战斗表",
        {
            id: {
                type: "unsigned",
            },
            地区编号: {
                type: "string",
                length: 255,
            },
            进攻方联军编号: {
                type: "string",
                length: 255,
            },
            防守方联军编号: {
                type: "string",
                length: 255,
            },
            回合数: {
                type: "unsigned",
                initial: 0,
            },
            状态: {
                type: "string",
                length: 32,
                initial: 战斗状态.进行中,
            },
            开始时间: {
                type: "string",
                length: 255,
            },
            结束时间: {
                type: "string",
                length: 255,
                nullable: true,
                initial: null,
            },
            结果: {
                type: "string",
                length: 64,
                nullable: true,
                initial: null,
            },
        },
        {
            primary: "id",
            autoInc: true,
        },
    );
}
