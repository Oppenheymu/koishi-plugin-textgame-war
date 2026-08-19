// 进军工作流（详见 军事系统.prompt.md 第 7 章指令的业务部分）
import type { Context } from "koishi";
import type { Army } from "#ctx/military/domain/types/数据类型";

import { 军队命令, 军队状态 } from "#ctx/military/domain/types/枚举";

import { 聚合军队面板 } from "#ctx/military/domain/属性聚合";

import { 校验指挥与命令覆盖 } from "#ctx/military/domain/指挥权限";

import { 校验进军目标, 计算行军毫秒数 } from "#ctx/military/domain/行军计算";

import { 地区解析 } from "#ctx/region";

export async function 进军工作流(
    ctx: Context,
    军队: Army,
    目标地区编号: string,
    操作者UID: string,
): Promise<{ 行军分钟数: number; 预计到达时间: string }> {
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("只有驻扎状态的军队才能进军");
    }

    // 指挥权 + 命令优先级校验（将官越权指挥需军衔 ≥ 当前命令军衔）
    const { 操作者军衔 } = await 校验指挥与命令覆盖(ctx, 军队, 操作者UID);

    const 出发解析 = await 地区解析(ctx, 军队.所在地区编号);
    const 目标解析 = await 地区解析(ctx, 目标地区编号);

    const 拒绝原因 = 校验进军目标({
        军队,
        出发地区: 出发解析.地区资料,
        目标地区: 目标解析.地区资料,
        目标地貌: 目标解析.地区地形资料,
    });
    if (拒绝原因) {
        throw new Error(拒绝原因);
    }

    const 面板 = 聚合军队面板(军队);
    if (面板.速度 <= 0) {
        throw new Error("该军队没有任何可行动的单位，无法进军");
    }

    const 行军毫秒 = 计算行军毫秒数({
        基础速度: 面板.速度,
        出发地区编号: 军队.所在地区编号,
        目标地区编号: 目标解析.地区编号,
        出发地形: 出发解析.地区资料.地区地形,
        目标地形: 目标解析.地区资料.地区地形,
        目标地貌: 目标解析.地区地形资料,
    });

    const 预计到达时间 = new Date(Date.now() + 行军毫秒).toISOString();
    await ctx.database.set(
        "马列军队表",
        { id: 军队.id },
        {
            状态: 军队状态.移动中,
            目标地区编号: 目标解析.地区编号,
            预计到达时间,
            当前命令: 军队命令.正常,
            命令下达者军衔: 操作者军衔,
        },
    );

    return { 行军分钟数: 行军毫秒 / 60000, 预计到达时间 };
}
