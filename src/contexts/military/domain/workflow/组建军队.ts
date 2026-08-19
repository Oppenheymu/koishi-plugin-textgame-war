// 组建军队工作流（详见 军事系统.prompt.md 第 7 章指令的业务部分）
import type { Context } from "koishi";
import type { CoalitionArmy } from "#ctx/coalition";
import { 军衔权益表 } from "#ctx/military/domain/types/常量";

import { 军衔, 军队命令, 军队状态 } from "#ctx/military/domain/types/枚举";

import { 获取玩家军队列表, 获取联军军衔记录 } from "#ctx/military/domain/军队解析";

import { 创建改名审核工单, 校验名称文本 } from "#ctx/naming";
import type { 军队操作者 } from "./军队操作者.js";

export async function 组建军队工作流(
    ctx: Context,
    联军资料: CoalitionArmy,
    操作者: 军队操作者,
    自定义名称?: string,
): Promise<{
    军队编号: number;
    番号: number;
    名称: string;
    审核工单编号: number | undefined;
}> {
    const 联军编号 = 联军资料.联军编号;

    // 军衔校验：无军衔不能建军（避免军阀化），最低少尉
    const 军衔记录 = await 获取联军军衔记录(ctx, 联军编号, 操作者.uid);
    if (!军衔记录 || 军衔记录.军衔 < 军衔.少尉) {
        throw new Error("你没有军衔，无法组建军队（请等待联军授衔，最低少尉）");
    }

    // 建军数量上限
    const 权益 = 军衔权益表[军衔记录.军衔];
    const 已有军队 = await 获取玩家军队列表(ctx, 联军编号, 操作者.uid);
    if (已有军队.length >= 权益.可建军数量) {
        throw new Error(
            `你的军衔（${军衔记录.军衔}级）最多可指挥 ${权益.可建军数量} 支军队，当前已有 ${已有军队.length} 支`,
        );
    }

    // 初始驻地：玩家驻扎地区 → 联军首都
    const 所在地区编号 = 操作者.用户资料.驻扎地区 || 联军资料.联军首都;
    if (!所在地区编号) {
        throw new Error("无法确定军队驻地：你尚未驻扎任何地区，且联军未设置首都");
    }
    const [驻地] = await ctx.database.get("马列地区表", {
        地区编号: 所在地区编号,
    });
    if (!驻地) {
        throw new Error(`驻地地区 ${所在地区编号} 不存在，请联系管理员`);
    }

    // 番号 = 联军内 max(番号) + 1
    const 联军军队 = await ctx.database.get("马列军队表", {
        所属联军编号: 联军编号,
    });
    const 番号 = 联军军队.reduce((最大, 军队) => Math.max(最大, 军队.番号), 0) + 1;

    const 联军名 = 联军资料.联军名称 || 联军编号;
    const 默认名称 = `${联军名}第${番号}军`;

    const 新军队 = await ctx.database.create("马列军队表", {
        番号,
        名称: 默认名称,
        名称是否审核: 联军资料.名称是否审核,
        所属联军编号: 联军编号,
        指挥官UID: 操作者.uid,
        士兵数量: 0,
        经验值: 0,
        状态: 军队状态.驻扎,
        所在地区编号,
        目标地区编号: null,
        预计到达时间: null,
        当前组织度比例: 1,
        当前HP比例: 1,
        当前命令: 军队命令.正常,
        命令下达者军衔: 0,
        当前战斗编号: null,
        战斗阵营: null,
        建立日期: new Date().toISOString(),
    });

    // 自定义名称 → 走改名审核工单（强制联军名前缀）
    let 审核工单编号: number | undefined;
    const 名称部分 = 自定义名称?.trim();
    if (名称部分) {
        const 校验错误 = 校验名称文本(名称部分, "军队");
        if (校验错误) {
            throw new Error(`军队已按默认名称组建，但自定义名称无效：${校验错误}`);
        }
        const 工单 = await 创建改名审核工单(ctx, {
            类型: "军队",
            新名称: `${联军名}${名称部分}`,
            申请人ID: 操作者.id,
            申请人UID: 操作者.uid,
            申请人名称: 操作者.username,
            军队编号: 新军队.id,
        });
        审核工单编号 = 工单.工单编号;
    }

    return { 军队编号: 新军队.id, 番号, 名称: 默认名称, 审核工单编号 };
}
