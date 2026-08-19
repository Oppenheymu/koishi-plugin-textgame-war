import dayjs from "dayjs";
import type { Context, Session } from "koishi";
import { Logger } from "koishi";
import type { Player } from "#ctx/player/domain/types/基本类型";
import type { RegionStrategy } from "#ctx/region/domain/types/战略类型";
import { 玩家检查 } from "#ctx/player/domain/守卫";
import { 更新地区战略资料 } from "#ctx/region/domain/更新";
import { 驻扎检查 } from "#ctx/region/domain/守卫";
import type { 特殊建筑属性, 特殊设施类型, 设施建造对象 } from "#/interfaces/commands/region/建筑/config";
import { 特殊建筑库 } from "#/interfaces/commands/region/建筑/config";
import {
    创建默认设施对象,
    执行资源与工资结算,
    格式化,
    组装消耗文本,
    解析轮次,
    计算最大可执行轮次,
} from "#/interfaces/commands/region/建筑/utils";

const logger = new Logger("特殊设施建造");

function 校验特殊设施资格(用户资料: Player, 建筑属性: 特殊建筑属性): string | null {
    if (用户资料.生产次数 <= 0) {
        return "生产次数不足";
    }

    if (用户资料.科技等级 < 建筑属性.科技需求) {
        return `科技等级不足，修建${建筑属性.显示名}需要科技等级 ${格式化(建筑属性.科技需求)}`;
    }

    if (用户资料.工人 * 用户资料.生产技术 <= 0) {
        return "当前生产力为零，无法修建";
    }

    return null;
}

function 解析目标编号(编号输入: number, 设施映射: Record<number, 设施建造对象>): number {
    return Number.isFinite(编号输入)
        ? Math.max(1, Math.floor(编号输入 ?? 1))
        : Math.max(1, ...Object.keys(设施映射).map((编号) => Number(编号) || 0)) +
              (Object.keys(设施映射).length ? 1 : 0);
}

async function 保存地区设施(
    ctx: Context,
    地区编号: string,
    类型: 特殊设施类型,
    设施映射: Record<number, 设施建造对象>,
): Promise<void> {
    const 更新对象 = {
        [类型]: 设施映射,
    } as Partial<RegionStrategy>;

    logger.info(
        `[保存前] 类型字段: ${类型}, 设施映射数量: ${Object.keys(设施映射).length}, 更新对象:`,
        更新对象,
    );

    try {
        await 更新地区战略资料(ctx, 地区编号, 更新对象);
        logger.info(`[保存成功] 地区: ${地区编号}, 类型: ${类型}`);
    } catch (error) {
        logger.error(`[保存失败] 地区: ${地区编号}, 类型: ${类型}, 错误:`, error);
        throw error;
    }
}

function 构建特殊设施回报(参数: {
    username: string;
    展示地区名称: string;
    地区编号: string;
    建筑属性: 特殊建筑属性;
    目标编号: number;
    现有设施: 设施建造对象;
    更新后进度: number;
    是否完工: boolean;
    实际投入: number;
    工资消耗: number;
    资源消耗: Record<string, number>;
}): string {
    const {
        username,
        展示地区名称,
        地区编号,
        建筑属性,
        目标编号,
        现有设施,
        更新后进度,
        是否完工,
        实际投入,
        工资消耗,
        资源消耗,
    } = 参数;

    return [
        "====[征战文游]====",
        `${username} 同志：`,
        `■ 地区：${展示地区名称}（${地区编号}）`,
        `■ 修建目标：${建筑属性.显示名}#${目标编号}`,
        `■ 科技需求：${格式化(建筑属性.科技需求)}`,
        `■ 总需求生产力：${格式化(建筑属性.生产力需求)}`,
        `■ 本次投入生产力：${格式化(实际投入)}`,
        `■ 建造进度：${格式化(现有设施.建造进度)} → ${格式化(
            是否完工 ? 建筑属性.生产力需求 : 更新后进度,
        )} / ${格式化(建筑属性.生产力需求)}`,
        `■ 工资消耗：${格式化(工资消耗)}`,
        ...组装消耗文本(资源消耗),
        `■ 状态：${是否完工 ? "建造完成" : "建设中"}`,
    ].join("\n");
}

async function 执行特殊设施修建(
    ctx: Context,
    参数: {
        session: Session | undefined;
        类型: 特殊设施类型;
        编号输入: number;
        轮次输入: number;
    },
): Promise<string> {
    const { session, 类型, 编号输入, 轮次输入 } = 参数;
    const 建筑属性 = 特殊建筑库[类型];

    const { id, username, 当前驻扎地区, 地区编号, 展示地区名称, 地区战略资料 } = await 驻扎检查(
        ctx,
        session,
    );
    const { 用户资料 } = await 玩家检查(ctx, session);

    if (当前驻扎地区 !== 地区编号) {
        return `你当前驻扎在 ${当前驻扎地区 || "未驻扎地区"}，仅驻扎在本地区的玩家可修建${建筑属性.显示名}`;
    }

    const 轮次 = 解析轮次(轮次输入);
    if (轮次 <= 0) {
        return "请输入有效轮次（正整数）";
    }

    const 资格错误 = 校验特殊设施资格(用户资料, 建筑属性);
    if (资格错误) {
        return 资格错误;
    }

    const 单轮生产力 = 用户资料.工人 * 用户资料.生产技术;

    // 使用通用的最大轮次计算
    const 最大可执行轮次 = 计算最大可执行轮次(用户资料, 建筑属性.资源需求, 轮次);

    if (最大可执行轮次 <= 0) {
        return "资源或生活资料不足，无法完成任意一轮修建";
    }

    const 原始设施映射 = (地区战略资料[类型] ?? {}) as Record<number, 设施建造对象>;
    const 设施映射: Record<number, 设施建造对象> = {
        ...原始设施映射,
    };

    const 目标编号 = 解析目标编号(编号输入, 设施映射);

    const 现有设施 = 设施映射[目标编号] ?? 创建默认设施对象(类型);

    if (现有设施.建造进度 >= 建筑属性.生产力需求) {
        return `${建筑属性.显示名}#${目标编号} 已建成`;
    }

    const 剩余需求 = Math.max(0, 建筑属性.生产力需求 - 现有设施.建造进度);
    const 投入总生产力 = 单轮生产力 * 最大可执行轮次;
    const 实际投入 = Math.min(剩余需求, 投入总生产力);
    const 实际轮次 = Math.ceil(实际投入 / 单轮生产力);

    if (实际投入 <= 0 || 实际轮次 <= 0) {
        return `${建筑属性.显示名}#${目标编号} 当前无需继续投入`;
    }

    const 更新后进度 = 现有设施.建造进度 + 实际投入;
    const 是否完工 = 更新后进度 >= 建筑属性.生产力需求;

    const { 工资消耗, 资源消耗 } = await 执行资源与工资结算(
        ctx,
        id,
        用户资料,
        实际轮次,
        建筑属性.资源需求,
    );

    设施映射[目标编号] = {
        ...现有设施,
        建造进度: 是否完工 ? 建筑属性.生产力需求 : 更新后进度,
        建造时间:
            是否完工 && !现有设施.建造时间
                ? dayjs().format("YYYY-MM-DD HH:mm")
                : (现有设施.建造时间 ?? ""),
    };

    logger.debug(`[建筑完成] 类型: ${类型}, 编号: ${目标编号}, 设施数据:`, 设施映射);

    await 保存地区设施(ctx, 地区编号, 类型, 设施映射);

    return 构建特殊设施回报({
        username,
        展示地区名称,
        地区编号,
        建筑属性,
        目标编号,
        现有设施,
        更新后进度,
        是否完工,
        实际投入,
        工资消耗,
        资源消耗,
    });
}

export function 修建地区生物实验室(ctx: Context) {
    ctx.command("修建地区生物实验室 [编号:number] [轮次:number]")
        .alias("修建生物实验室")
        .alias("建造生物实验室")
        .action(async ({ session }, 编号输入, 轮次输入) => {
            try {
                return await 执行特殊设施修建(ctx, {
                    session,
                    类型: "生物实验室",
                    编号输入,
                    轮次输入,
                });
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 修建地区离心机组(ctx: Context) {
    ctx.command("修建地区离心机组 [编号:number] [轮次:number]")
        .alias("修建高速离心级联")
        .alias("修建离心机组")
        .action(async ({ session }, 编号输入, 轮次输入) => {
            try {
                return await 执行特殊设施修建(ctx, {
                    session,
                    类型: "高速离心级联",
                    编号输入,
                    轮次输入,
                });
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 修建地区核反应堆(ctx: Context) {
    ctx.command("修建地区核反应堆 [编号:number] [轮次:number]")
        .alias("修建核反应堆")
        .alias("建造核反应堆")
        .action(async ({ session }, 编号输入, 轮次输入) => {
            try {
                return await 执行特殊设施修建(ctx, {
                    session,
                    类型: "核反应堆",
                    编号输入,
                    轮次输入,
                });
            } catch (error) {
                return (error as Error).message;
            }
        });
}
