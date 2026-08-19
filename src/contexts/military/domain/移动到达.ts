// 移动到达处理（详见 军事系统.prompt.md 5.4）
// 每 5 分钟轮询：到达无敌军 → 驻扎；到达有敌军 → 创建/加入战斗；撤退到达 → 驻扎
import type { Context } from "koishi";
import type { Army, Battle } from "#ctx/military/domain/types/数据类型";
import { 军队命令, 军队状态, 战斗状态, 战斗阵营 } from "#ctx/military/domain/types/枚举";
import { 加载联军名称缓存, 向地区绑定群推送 } from "#ctx/military/domain/战报推送";

/** 军队到达目标地区后的入场处理（触发战斗或驻扎） */
async function 处理单支军队到达(ctx: Context, 军队: Army, 目标地区编号: string): Promise<void> {
    const 基础更新 = {
        所在地区编号: 目标地区编号,
        目标地区编号: null,
        预计到达时间: null,
    };

    // 撤退中到达友方地区 → 转驻扎
    if (军队.状态 === 军队状态.撤退中) {
        await ctx.database.set(
            "马列军队表",
            { id: 军队.id },
            {
                ...基础更新,
                状态: 军队状态.驻扎,
                当前命令: 军队命令.正常,
                命令下达者军衔: 0,
            },
        );
        return;
    }

    // 移动中到达：检查目标地区是否有他国军队（驻扎/战斗中均视为在场）
    const 在场军队 = await ctx.database.get("马列军队表", {
        所在地区编号: 目标地区编号,
    });
    const 敌军 = 在场军队.filter(
        (item) =>
            item.所属联军编号 !== 军队.所属联军编号 &&
            item.id !== 军队.id &&
            (item.状态 === 军队状态.驻扎 || item.状态 === 军队状态.战斗中),
    );

    // 无敌军 → 驻扎；无人防守的他国地区直接占领（可调，第一阶段简化）
    if (敌军.length === 0) {
        await ctx.database.set(
            "马列军队表",
            { id: 军队.id },
            {
                ...基础更新,
                状态: 军队状态.驻扎,
            },
        );

        const [目标地区] = await ctx.database.get("马列地区表", {
            地区编号: 目标地区编号,
        });
        if (目标地区?.控制国家 && 目标地区.控制国家 !== 军队.所属联军编号) {
            await ctx.database.set(
                "马列地区表",
                { 地区编号: 目标地区编号 },
                { 控制国家: 军队.所属联军编号 },
            );
            // TODO(第二阶段): 占领通报（信号塔/战报推送）
        }
        return;
    }

    // 有敌军 → 触发战斗：查找该地区是否已有进行中战斗
    const [现存战斗] = await ctx.database.get("马列战斗表", {
        地区编号: 目标地区编号,
        状态: 战斗状态.进行中,
    });

    let 战斗: Battle;
    if (现存战斗) {
        战斗 = 现存战斗;
    } else {
        // 创建新战斗：到达军队为进攻方，驻扎军队为防守方
        const 防守方联军编号 = 敌军[0]!.所属联军编号;
        const 创建结果 = await ctx.database.create("马列战斗表", {
            地区编号: 目标地区编号,
            进攻方联军编号: 军队.所属联军编号,
            防守方联军编号,
            回合数: 0,
            状态: 战斗状态.进行中,
            开始时间: new Date().toISOString(),
            结束时间: null,
            结果: null,
        });
        战斗 = 创建结果;

        // 驻扎中的守方军队全部卷入战斗
        await Promise.all(
            敌军
                .filter((item) => item.状态 === 军队状态.驻扎)
                .map((item) =>
                    ctx.database.set(
                        "马列军队表",
                        { id: item.id },
                        {
                            状态: 军队状态.战斗中,
                            当前战斗编号: 战斗.id,
                            战斗阵营: 战斗阵营.防守,
                        },
                    ),
                ),
        );

        const 名称缓存 = await 加载联军名称缓存(ctx, [军队.所属联军编号, 防守方联军编号]);
        await 向地区绑定群推送(
            ctx,
            目标地区编号,
            [
                `【战报】${目标地区编号}地区 战斗打响！`,
                `进攻方：${名称缓存.get(军队.所属联军编号)}`,
                `防守方：${名称缓存.get(防守方联军编号)}`,
            ].join("\n"),
        );
    }

    // 到达军队加入战斗
    // TODO(第二阶段): 多方混战拆分——第三国军队目前一律按进攻方入场
    const 阵营 = 军队.所属联军编号 === 战斗.防守方联军编号 ? 战斗阵营.防守 : 战斗阵营.进攻;

    await ctx.database.set(
        "马列军队表",
        { id: 军队.id },
        {
            ...基础更新,
            状态: 军队状态.战斗中,
            当前战斗编号: 战斗.id,
            战斗阵营: 阵营,
        },
    );
}

/** 轮询所有到达的移动中/撤退中军队 */
export async function 处理移动到达(ctx: Context): Promise<void> {
    const 现在 = new Date().toISOString();
    const [移动中军队, 撤退中军队] = await Promise.all([
        ctx.database.get("马列军队表", { 状态: 军队状态.移动中 }),
        ctx.database.get("马列军队表", { 状态: 军队状态.撤退中 }),
    ]);
    const 候选军队 = [...移动中军队, ...撤退中军队];

    const 到达军队 = 候选军队.filter((军队) => 军队.预计到达时间 && 军队.预计到达时间 <= 现在);

    for (const 军队 of 到达军队) {
        if (!军队.目标地区编号) continue;
        try {
            await 处理单支军队到达(ctx, 军队, 军队.目标地区编号);
        } catch (error) {
            ctx.logger("移动到达").error(
                `军队 #${军队.id} 到达处理失败：${error instanceof Error ? error.message : error}`,
            );
        }
    }
}
