import type { Context } from "koishi";
import { 格式化, 计算最大可执行轮次, 资源总消耗 } from "#/interfaces/commands/region/建筑/utils";
import type { 建筑属性 } from "#/interfaces/commands/region/建筑/修建建筑库";
import type { Player } from "#ctx/player";
import { 更新玩家资料 } from "#ctx/player";
import type { Region } from "#ctx/region";
import { 更新地区资料 } from "#ctx/region";

export interface 地区容量 {
    当前值: number;
    上限值: number;
}

export function 读取地区容量(地区资料: Region, 建筑属性: 建筑属性): 地区容量 {
    const 当前值 = (地区资料[建筑属性.当前字段 as keyof typeof 地区资料] as number) ?? 0;
    const 上限值 = (地区资料[建筑属性.上限字段 as keyof typeof 地区资料] as number) ?? 0;
    return { 当前值, 上限值 };
}

export function 校验修建资格(用户资料: Player, 建筑属性: 建筑属性, 容量: 地区容量): string | null {
    if (用户资料.科技等级 < 建筑属性.科技需求) {
        return `科技等级不足，修建${建筑属性.显示名}需要科技等级 ${建筑属性.科技需求}`;
    }

    if (用户资料.生产次数 <= 0) {
        return "生产次数不足";
    }

    if (容量.当前值 >= 容量.上限值) {
        return `${建筑属性.显示名}已达上限（${格式化(容量.当前值)} / ${格式化(容量.上限值)}）`;
    }

    return null;
}

export interface 修建结算结果 {
    实际轮次: number;
    增量: number;
    更新后当前值: number;
    工资消耗: number;
    资源消耗: Record<string, number>;
}

export async function 执行地区建筑修建(
    ctx: Context,
    id: number,
    地区编号: string,
    用户资料: Player,
    建筑属性: 建筑属性,
    轮次: number,
    容量: 地区容量,
): Promise<修建结算结果 | string> {
    const 单轮生产力 = 用户资料.工人 * 用户资料.生产技术;
    if (单轮生产力 <= 0) {
        return "当前生产力为零，无法修建";
    }

    if (单轮生产力 < 建筑属性.生产力需求) {
        return `单轮生产力不足，修建${建筑属性.显示名}每轮至少需要 ${格式化(建筑属性.生产力需求)} 生产力`;
    }

    // 使用通用的最大轮次计算
    const 最大可执行轮次 = 计算最大可执行轮次(用户资料, 建筑属性.资源需求, 轮次);

    if (最大可执行轮次 <= 0) {
        return "资源或生活资料不足，无法完成任意一轮修建";
    }

    const 单轮工资 = 用户资料.工人 * 用户资料.工人工资;
    const 剩余容量 = Math.max(0, 容量.上限值 - 容量.当前值);
    const 达到上限所需轮次 = Math.ceil(剩余容量 / 单轮生产力);
    const 实际轮次 = Math.min(最大可执行轮次, 达到上限所需轮次);
    const 增量 = Math.min(剩余容量, 单轮生产力 * 实际轮次);

    if (增量 <= 0) {
        return `${建筑属性.显示名}已达上限（${格式化(容量.当前值)} / ${格式化(容量.上限值)}）`;
    }

    const 工资消耗 = 单轮工资 * 实际轮次;
    const 资源消耗 = 资源总消耗(建筑属性.资源需求 as Record<string, number>, 实际轮次);
    const 更新后当前值 = 容量.当前值 + 增量;

    await Promise.all([
        更新地区资料(ctx, 地区编号, {
            [建筑属性.当前字段]: 更新后当前值,
        }),
        更新玩家资料(ctx, id, {
            钢铁: 用户资料.钢铁 - (资源消耗["钢铁"] ?? 0),
            金属铝: 用户资料.金属铝 - (资源消耗["金属铝"] ?? 0),
            生活资料: 用户资料.生活资料 - 工资消耗,
            生产次数: 用户资料.生产次数 - 实际轮次,
        }),
    ]);

    return { 实际轮次, 增量, 更新后当前值, 工资消耗, 资源消耗 };
}

export function 构建修建回报(参数: {
    username: string;
    展示地区名称: string;
    地区编号: string;
    建筑属性: 建筑属性;
    轮次: number;
    容量: 地区容量;
    结算: 修建结算结果;
}): string {
    const { username, 展示地区名称, 地区编号, 建筑属性, 轮次, 容量, 结算 } = 参数;

    const 资源消耗文本: string[] = [];
    if ((结算.资源消耗["钢铁"] ?? 0) > 0) {
        资源消耗文本.push(`■ 钢铁消耗：${格式化(结算.资源消耗["钢铁"] ?? 0)}`);
    }
    if ((结算.资源消耗["金属铝"] ?? 0) > 0) {
        资源消耗文本.push(`■ 金属铝消耗：${格式化(结算.资源消耗["金属铝"] ?? 0)}`);
    }

    return [
        "====[征战文游]====",
        `${username} 同志：`,
        `■ 地区：${展示地区名称}（${地区编号}）`,
        `■ 修建类型：${建筑属性.显示名}`,
        `■ 科技需求：${格式化(建筑属性.科技需求)}`,
        `■ 执行轮次：${格式化(结算.实际轮次)} / ${格式化(轮次)}`,
        `■ 本次增量：${格式化(结算.增量)}`,
        `■ 当前容量：${格式化(容量.当前值)} → ${格式化(结算.更新后当前值)} / ${格式化(容量.上限值)}`,
        `■ 工资消耗：${格式化(结算.工资消耗)}`,
        ...资源消耗文本,
    ].join("\n");
}
