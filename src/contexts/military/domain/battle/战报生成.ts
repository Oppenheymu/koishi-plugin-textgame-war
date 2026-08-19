// 战报生成（6.9，详见 军事系统.prompt.md 第 6 章）
import type { Context } from "koishi";
import { 战报显示精确数值 } from "#ctx/military/domain/types/常量";

import type { Battle } from "#ctx/military/domain/types/数据类型";

import {
    HP分级,
    加载联军名称缓存,
    向地区绑定群推送,
    组织度分级,
} from "#ctx/military/domain/战报推送";

import type { 军队本轮统计 } from "./本轮统计.js";

/** 战报中的一行军队状态（模糊分级，可调为精确数值） */
function 格式化军队战况(统计: 军队本轮统计): string {
    const { 军队 } = 统计;
    if (战报显示精确数值) {
        return `■ ${军队.名称}：组织度 ${(军队.当前组织度比例 * 100).toFixed(0)}% / HP ${(军队.当前HP比例 * 100).toFixed(0)}%`;
    }
    return `■ ${军队.名称}：${组织度分级(军队.当前组织度比例)} / ${HP分级(军队.当前HP比例)}`;
}

/** 推送战报（6.9：地区群简报 + 双方首都群大战报） */
export async function 推送战报(
    ctx: Context,
    战斗: Battle,
    攻方: 军队本轮统计[],
    守方: 军队本轮统计[],
    事件列表: string[],
    是否终局: boolean,
): Promise<void> {
    const 名称缓存 = await 加载联军名称缓存(ctx, [战斗.进攻方联军编号, 战斗.防守方联军编号]);
    const 攻方名称 = 名称缓存.get(战斗.进攻方联军编号);
    const 守方名称 = 名称缓存.get(战斗.防守方联军编号);

    const 文本行: string[] = [
        `【战报】${战斗.地区编号}地区 第${战斗.回合数}回合${是否终局 ? "（终局）" : ""}`,
        `进攻方：${攻方名称} | 防守方：${守方名称}`,
        ...攻方.map(格式化军队战况),
        ...守方.map(格式化军队战况),
        ...事件列表,
    ];
    const 文本 = 文本行.join("\n");

    // 战斗发生地区绑定群聊（每轮简报）
    await 向地区绑定群推送(ctx, 战斗.地区编号, 文本);

    // 双方联军首都绑定群聊（大战报）
    const 联军列表 = await ctx.database.get("马列联军表", {
        联军编号: { $in: [战斗.进攻方联军编号, 战斗.防守方联军编号] },
    });
    for (const 联军 of 联军列表) {
        if (联军.联军首都 && 联军.联军首都 !== 战斗.地区编号) {
            await 向地区绑定群推送(ctx, 联军.联军首都, 文本);
        }
    }
}
