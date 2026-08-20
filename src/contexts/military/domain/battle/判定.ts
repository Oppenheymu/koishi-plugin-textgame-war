// 战斗判定（6.2 死守惩罚 / 歼灭 / 溃退 + 6.6 实际损失，详见 军事系统.prompt.md 第 6 章）
import type { Context } from "koishi";
import type { 军队面板 } from "#ctx/military/domain/types/军队面板";
import { HP损失转化率, 死守HP伤害倍率, 经验累积系数 } from "#ctx/military/domain/types/常量";
import type { Army } from "#ctx/military/domain/types/数据类型";
import { 军队命令 } from "#ctx/military/domain/types/枚举";
import { 军队装备数量列名单 } from "#ctx/military/domain/types/装备属性表";

import { 执行撤退 } from "./撤退结算.js";
import type { 军队本轮统计 } from "./本轮统计.js";

/** 死守惩罚（6.2：组织度锁 0，每轮额外吃 HP 伤害 ×1.5） */
export function 应用死守惩罚(统计列表: 军队本轮统计[]): void {
    for (const 统计 of 统计列表) {
        if (
            统计.军队.当前命令 === 军队命令.死守 &&
            统计.军队.当前组织度比例 <= 0 &&
            统计.本轮HP损失 > 0
        ) {
            const 额外损失 = 统计.本轮HP损失 * (死守HP伤害倍率 - 1);
            统计.军队.当前HP比例 = Math.max(0, 统计.军队.当前HP比例 - 额外损失);
            统计.本轮HP损失 += 额外损失;
        }
    }
}

/** 歼灭判定（HP 归零 / 兵力打光 → 移除军队记录），返回存活列表 */
export async function 执行存活判定(
    ctx: Context,
    统计列表: 军队本轮统计[],
    阵营名称: string,
    事件列表: string[],
): Promise<军队本轮统计[]> {
    const 存活: 军队本轮统计[] = [];
    for (const 统计 of 统计列表) {
        if (统计.军队.当前HP比例 <= 0 || 统计.军队.士兵数量 <= 0) {
            await ctx.database.remove("征战军队表", { id: 统计.军队.id });
            事件列表.push(`💥 ${统计.军队.名称}（${阵营名称}）被歼灭`);
        } else {
            存活.push(统计);
        }
    }
    return 存活;
}

/**
 * 溃退判定（6.2：组织度归零且非死守 → 强制撤退；听令撤退同批处理）
 * 撤离前同样结算本轮战损转化（6.6），堵住"撤退免永久损失"的漏洞
 */
export async function 执行溃退判定(
    ctx: Context,
    统计列表: 军队本轮统计[],
    阵营名称: string,
    战斗地区编号: string,
    事件列表: string[],
): Promise<军队本轮统计[]> {
    const 留下: 军队本轮统计[] = [];
    for (const 统计 of 统计列表) {
        const 溃退 = 统计.军队.当前组织度比例 <= 0 && 统计.军队.当前命令 !== 军队命令.死守;
        const 听令撤退 = 统计.军队.当前命令 === 军队命令.撤退;
        if (!溃退 && !听令撤退) {
            留下.push(统计);
            continue;
        }

        const 损失率 = Math.min(1, 统计.本轮HP损失 * HP损失转化率);
        if (损失率 > 0) {
            const 剩余士兵 = Math.floor(统计.军队.士兵数量 * (1 - 损失率));
            if (剩余士兵 <= 0) {
                await ctx.database.remove("征战军队表", { id: 统计.军队.id });
                事件列表.push(`💥 ${统计.军队.名称}（${阵营名称}）残部打光，编制撤销`);
                continue;
            }
            const 战损更新: Record<string, unknown> = { 士兵数量: 剩余士兵 };
            for (const 键 of 军队装备数量列名单) {
                战损更新[键] = Math.floor(((统计.军队[键] as number) ?? 0) * (1 - 损失率));
            }
            await ctx.database.set("征战军队表", { id: 统计.军队.id }, 战损更新);
            统计.军队.士兵数量 = 剩余士兵;
        }

        const { 结果, 目的地 } = await 执行撤退(ctx, 统计.军队, 统计.面板, 战斗地区编号);
        if (结果 === "歼灭") {
            事件列表.push(`💥 ${统计.军队.名称}（${阵营名称}）无路可退，被歼灭`);
        } else {
            事件列表.push(
                `🏳️ ${统计.军队.名称}（${阵营名称}）${溃退 ? "溃退" : "撤退"}至 ${目的地}`,
            );
        }
    }
    return 留下;
}

/**
 * 实际损失结算（6.6：本轮HP损失 × 70% 转为装备与士兵永久损失）
 * 战损折算后士兵归零 → 编制打光，就地歼灭（修复 floor 取整后的"僵尸军队"）
 */
export async function 结算实际损失(
    ctx: Context,
    统计列表: 军队本轮统计[],
    阵营名称: string,
    事件列表: string[],
): Promise<军队本轮统计[]> {
    const 仍存活: 军队本轮统计[] = [];
    for (const 统计 of 统计列表) {
        const 损失率 = Math.min(1, 统计.本轮HP损失 * HP损失转化率);
        const 剩余士兵 =
            损失率 > 0 ? Math.floor(统计.军队.士兵数量 * (1 - 损失率)) : 统计.军队.士兵数量;

        if (剩余士兵 <= 0) {
            await ctx.database.remove("征战军队表", { id: 统计.军队.id });
            事件列表.push(`💥 ${统计.军队.名称}（${阵营名称}）残部打光，编制撤销`);
            continue;
        }

        const 更新: Record<string, unknown> = {
            当前组织度比例: 统计.军队.当前组织度比例,
            当前HP比例: 统计.军队.当前HP比例,
            经验值: 统计.军队.经验值 + 统计.本轮造成组织度伤害 * 经验累积系数,
            士兵数量: 剩余士兵,
        };
        if (损失率 > 0) {
            for (const 键 of 军队装备数量列名单) {
                更新[键] = Math.floor(((统计.军队[键] as number) ?? 0) * (1 - 损失率));
            }
        }
        await ctx.database.set("征战军队表", { id: 统计.军队.id }, 更新);
        仍存活.push(统计);
    }
    return 仍存活;
}

/** 预备队（未上场）统计包装：本轮无战损无经验，仅用于结束判定与战报展示 */
export function 包装预备队统计(军队列表: Army[], 取面板: (军队: Army) => 军队面板): 军队本轮统计[] {
    return 军队列表.map((军队) => ({
        军队,
        面板: 取面板(军队),
        本轮组织度损失: 0,
        本轮HP损失: 0,
        本轮造成组织度伤害: 0,
    }));
}
