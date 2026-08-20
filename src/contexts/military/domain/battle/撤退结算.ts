// 撤退结算（6.7，详见 军事系统.prompt.md 第 6 章）
import type { Context } from "koishi";
import type { 军队面板 } from "#ctx/military/domain/types/军队面板";

import type { Army } from "#ctx/military/domain/types/数据类型";

import { 军队状态 } from "#ctx/military/domain/types/枚举";

import { 计算行军毫秒数, 选择撤退目的地 } from "#ctx/military/domain/行军计算";

import type { Region } from "#ctx/region";
import { 获取相邻地区 } from "#ctx/region";

/** 撤退（6.7）：返回 "撤退" | "歼灭" */
export async function 执行撤退(
    ctx: Context,
    军队: Army,
    面板: 军队面板,
    战斗地区编号: string,
): Promise<{ 结果: "撤退" | "歼灭"; 目的地?: string }> {
    const 邻居编号列表 = await 获取相邻地区(ctx, 战斗地区编号);
    const 相邻地区列表: Region[] = [];
    for (const { 地区编号 } of 邻居编号列表) {
        const [地区] = await ctx.database.get("征战地区表", { 地区编号 });
        if (地区) 相邻地区列表.push(地区);
    }

    const 目的地 = 选择撤退目的地({
        当前地区编号: 战斗地区编号,
        所属联军编号: 军队.所属联军编号,
        相邻地区列表,
    });

    // 无路可退（四邻皆敌/海洋）→ 歼灭，装备与士兵全损
    if (!目的地) {
        await ctx.database.remove("征战军队表", { id: 军队.id });
        return { 结果: "歼灭" };
    }

    const [目的地区] = await ctx.database.get("征战地区表", {
        地区编号: 目的地,
    });
    const [战斗地区] = await ctx.database.get("征战地区表", {
        地区编号: 战斗地区编号,
    });
    const [目的地貌] = await ctx.database.get("征战地区地形表", {
        地区编号: 目的地,
    });

    const 行军毫秒 =
        目的地区 && 战斗地区 && 目的地貌
            ? 计算行军毫秒数({
                  基础速度: Math.max(1, 面板.速度),
                  出发地区编号: 战斗地区编号,
                  目标地区编号: 目的地,
                  出发地形: 战斗地区.地区地形,
                  目标地形: 目的地区.地区地形,
                  目标地貌: 目的地貌,
              })
            : 5 * 60 * 1000;

    await ctx.database.set(
        "征战军队表",
        { id: 军队.id },
        {
            状态: 军队状态.撤退中,
            目标地区编号: 目的地,
            预计到达时间: new Date(Date.now() + 行军毫秒).toISOString(),
            当前战斗编号: null,
            战斗阵营: null,
            当前组织度比例: 0,
        },
    );
    return { 结果: "撤退", 目的地 };
}
