// 军队命名工作流（详见 军事系统.prompt.md 第 7 章指令的业务部分）
import type { Context } from "koishi";
import type { CoalitionArmy } from "#ctx/coalition";
import type { Army } from "#ctx/military/domain/types/数据类型";

import { 创建改名审核工单, 校验名称文本 } from "#ctx/naming";
import type { 军队操作者 } from "./军队操作者.js";

export async function 军队命名工作流(
    ctx: Context,
    联军资料: CoalitionArmy,
    军队: Army,
    操作者: 军队操作者,
    名称部分: string,
): Promise<{ 工单编号: number; 完整名称: string }> {
    if (军队.指挥官UID !== 操作者.uid) {
        throw new Error("只有指挥官本人才能为军队命名");
    }

    const 部分 = 名称部分?.trim();
    const 校验错误 = 校验名称文本(部分, "军队");
    if (校验错误) {
        throw new Error(校验错误);
    }

    const 联军名 = 联军资料.联军名称 || 联军资料.联军编号;
    const 完整名称 = `${联军名}${部分}`;

    const 工单 = await 创建改名审核工单(ctx, {
        类型: "军队",
        新名称: 完整名称,
        申请人ID: 操作者.id,
        申请人UID: 操作者.uid,
        申请人名称: 操作者.username,
        军队编号: 军队.id,
    });

    return { 工单编号: 工单.工单编号, 完整名称 };
}
