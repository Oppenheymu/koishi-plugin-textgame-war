// 战斗结束（写结果、胜方驻军、地区易主、推送终局战报，详见 军事系统.prompt.md 第 6 章）
import type { Context } from "koishi";
import type { Army, Battle } from "#ctx/military/domain/types/数据类型";

import { 军队命令, 军队状态, 战斗状态 } from "#ctx/military/domain/types/枚举";

import { 聚合军队面板 } from "#ctx/military/domain/属性聚合";

import { 推送战报 } from "./战报生成.js";
import type { 军队本轮统计 } from "./本轮统计.js";

/** 结束战斗：写结果、胜方驻军、地区易主、推送终局战报 */
export async function 结束战斗(
    ctx: Context,
    战斗: Battle,
    攻方剩余: (Army | 军队本轮统计)[],
    守方剩余: (Army | 军队本轮统计)[],
    事件列表: string[],
): Promise<void> {
    const 取军队 = (item: Army | 军队本轮统计): Army => ("军队" in item ? item.军队 : item);

    let 结果: string;
    if (攻方剩余.length > 0 && 守方剩余.length === 0) {
        结果 = "进攻方胜";
    } else if (守方剩余.length > 0 && 攻方剩余.length === 0) {
        结果 = "防守方胜";
    } else {
        结果 = "双方同归于尽";
    }

    await ctx.database.set(
        "征战战斗表",
        { id: 战斗.id },
        {
            回合数: 战斗.回合数,
            状态: 战斗状态.已结束,
            结束时间: new Date().toISOString(),
            结果,
        },
    );

    // 双方所有剩余参战军队（含预备队）统一脱战转驻扎、恢复满 HP（残余兵力重整，可调）
    // 败方残余如滞留敌区，可由指挥官下轮自行撤离（第一阶段简化处理）
    const 剩余参战军队 = await ctx.database.get("征战军队表", {
        当前战斗编号: 战斗.id,
    });
    await Promise.all(
        剩余参战军队.map((军队) =>
            ctx.database.set(
                "征战军队表",
                { id: 军队.id },
                {
                    状态: 军队状态.驻扎,
                    所在地区编号: 战斗.地区编号,
                    目标地区编号: null,
                    预计到达时间: null,
                    当前战斗编号: null,
                    战斗阵营: null,
                    当前HP比例: 1,
                    当前命令: 军队命令.正常,
                    命令下达者军衔: 0,
                },
            ),
        ),
    );

    // 进攻方胜 → 地区易主
    if (结果 === "进攻方胜") {
        await ctx.database.set(
            "征战地区表",
            { 地区编号: 战斗.地区编号 },
            { 控制国家: 战斗.进攻方联军编号 },
        );
        事件列表.push(`🏴 ${战斗.地区编号}地区已易主`);
    }

    事件列表.push(`⚔️ 战斗结束：${结果}`);

    // 终局战报（剩余军队可能为 0，容错处理）
    const 攻方统计 = 攻方剩余.map((item) => {
        const 军队 = 取军队(item);
        return {
            军队,
            面板: 聚合军队面板(军队),
            本轮组织度损失: 0,
            本轮HP损失: 0,
            本轮造成组织度伤害: 0,
        };
    });
    const 守方统计 = 守方剩余.map((item) => {
        const 军队 = 取军队(item);
        return {
            军队,
            面板: 聚合军队面板(军队),
            本轮组织度损失: 0,
            本轮HP损失: 0,
            本轮造成组织度伤害: 0,
        };
    });
    await 推送战报(ctx, 战斗, 攻方统计, 守方统计, 事件列表, true);
}
