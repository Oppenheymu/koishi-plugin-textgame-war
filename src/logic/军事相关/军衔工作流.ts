// 军衔工作流（详见 军事系统.prompt.md 第 2 章：双轨授衔 / 政体联动 / 褫夺）
import type { Context } from "koishi";
import type { CoalitionArmy } from "#/types";
import { 军衔, 军衔名称映射, 尉官军衔列表, 政体元首自动军衔 } from "#/types";
import { 获取联军军衔记录 } from "#/utils";
import { 获取联军操作权限 } from "../联军相关/设置权限";

export interface 授衔操作者信息 {
    uid: string;
    username: string;
    权限等级: number; // 联军权限等级（政治路校验用）
}

/**
 * 双轨授衔（2.2）：
 * - 政治路：联军权限"授衔"达标 → 可授任意军衔（含少将）
 * - 军事路：操作者军衔 = 少将 → 仅可授尉官级（对应现实军级单位批准初级军官）
 * 返回授衔结果描述
 */
export async function 授衔工作流(
    ctx: Context,
    联军资料: CoalitionArmy,
    操作者: 授衔操作者信息,
    目标UID: string,
    目标名称: string,
    目标军衔: 军衔,
): Promise<{ 途径: "政治授予" | "军事授予" }> {
    const 联军编号 = 联军资料.联军编号;

    // 目标必须是联军成员
    if (!联军资料.联军成员列表?.[目标UID]) {
        throw new Error(`${目标名称} 不是联军成员，无法授衔`);
    }

    // 政治路校验
    const 授衔所需等级 = await 获取联军操作权限(ctx, 联军编号, "授衔");
    const 政治路可行 = 操作者.权限等级 >= 授衔所需等级;

    // 军事路校验：少将仅可授尉官
    const 操作者军衔记录 = await 获取联军军衔记录(ctx, 联军编号, 操作者.uid);
    const 军事路可行 =
        操作者军衔记录?.军衔 === 军衔.少将 && 尉官军衔列表.includes(目标军衔);

    if (!政治路可行 && !军事路可行) {
        throw new Error(
            `授衔权限不足：需要联军 ${授衔所需等级} 级权限（政治任命），或由少将授予尉官军衔（军事任免）`,
        );
    }

    const 途径 = 政治路可行 ? ("政治授予" as const) : ("军事授予" as const);

    await ctx.database.upsert(
        "马列联军军衔表",
        [
            {
                联军编号,
                玩家UID: 目标UID,
                军衔: 目标军衔,
                来源: 途径,
                授予者UID: 操作者.uid,
                授予时间: new Date().toISOString(),
            },
        ],
        ["联军编号", "玩家UID"],
    );

    return { 途径 };
}

/**
 * 褫夺军衔（2.2：褫夺权与授予权同轨）
 * 被褫夺者指挥的所有军队转无主（2.4）
 */
export async function 褫夺军衔工作流(
    ctx: Context,
    联军资料: CoalitionArmy,
    操作者: 授衔操作者信息,
    目标UID: string,
    目标名称: string,
): Promise<{ 途径: "政治授予" | "军事授予"; 无主军队数: number }> {
    const 联军编号 = 联军资料.联军编号;

    const 目标军衔记录 = await 获取联军军衔记录(ctx, 联军编号, 目标UID);
    if (!目标军衔记录) {
        throw new Error(`${目标名称} 没有军衔，无需褫夺`);
    }

    // 政治路校验
    const 授衔所需等级 = await 获取联军操作权限(ctx, 联军编号, "授衔");
    const 政治路可行 = 操作者.权限等级 >= 授衔所需等级;

    // 军事路校验：少将仅可褫尉官
    const 操作者军衔记录 = await 获取联军军衔记录(ctx, 联军编号, 操作者.uid);
    const 军事路可行 =
        操作者军衔记录?.军衔 === 军衔.少将 &&
        尉官军衔列表.includes(目标军衔记录.军衔);

    if (!政治路可行 && !军事路可行) {
        throw new Error(
            `褫夺权限不足：需要联军 ${授衔所需等级} 级权限（政治路可褫任意军衔），或由少将褫夺尉官军衔`,
        );
    }

    await ctx.database.remove("马列联军军衔表", {
        联军编号,
        玩家UID: 目标UID,
    });

    // 其指挥的所有军队转无主（原地驻扎保留编制）
    const 目标军队 = await ctx.database.get("马列军队表", {
        所属联军编号: 联军编号,
        指挥官UID: 目标UID,
    });
    await Promise.all(
        目标军队.map((军队) =>
            ctx.database.set(
                "马列军队表",
                { id: 军队.id },
                {
                    指挥官UID: null,
                },
            ),
        ),
    );

    return {
        途径: 政治路可行 ? "政治授予" : "军事授予",
        无主军队数: 目标军队.length,
    };
}

/**
 * 政体联动：同步元首自动军衔（2.3）
 * 挂载点：政变 / 选择政体 / 元首变更后调用
 * - 旧元首的"政体自动"军衔移除
 * - 新元首按政体获得自动军衔（民主制无军衔）；已有手动军衔则保留不动
 */
export async function 同步元首政体军衔(
    ctx: Context,
    联军编号: string,
): Promise<void> {
    const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
    if (!联军资料) return;

    const 元首UID = 联军资料.联军元首;
    const 目标军衔 = 政体元首自动军衔[联军资料.联军政治体制];

    // 移除所有过期的"政体自动"军衔（非现任元首 或 政体已无自动军衔）
    const 自动军衔记录 = await ctx.database.get("马列联军军衔表", {
        联军编号,
        来源: "政体自动",
    });
    await Promise.all(
        自动军衔记录
            .filter((记录) => 记录.玩家UID !== 元首UID || !目标军衔)
            .map((记录) =>
                ctx.database.remove("马列联军军衔表", { id: 记录.id }),
            ),
    );

    if (!目标军衔 || !元首UID) return;

    const 元首军衔记录 = await 获取联军军衔记录(ctx, 联军编号, 元首UID);
    if (!元首军衔记录) {
        // 无军衔 → 授予政体自动军衔
        await ctx.database.create("马列联军军衔表", {
            联军编号,
            玩家UID: 元首UID,
            军衔: 目标军衔,
            来源: "政体自动",
            授予者UID: 元首UID,
            授予时间: new Date().toISOString(),
        });
        return;
    }

    if (元首军衔记录.来源 === "政体自动" && 元首军衔记录.军衔 !== 目标军衔) {
        // 政体变更 → 自动军衔跟着变
        await ctx.database.set(
            "马列联军军衔表",
            { id: 元首军衔记录.id },
            { 军衔: 目标军衔, 授予时间: new Date().toISOString() },
        );
    }
    // 手动授予的军衔不受政体变更影响（2.3）
}

/** 获取军衔展示文本（含权益说明） */
export function 格式化军衔名称(等级: number): string {
    return 军衔名称映射[等级 as 军衔] ?? "无军衔";
}
