/** biome-ignore-all lint/suspicious/noExplicitAny: 动态流程不好做静态类型 */

import dayjs from "dayjs";
import type { Context } from "koishi";
import { 特殊建筑库 } from "#/interfaces/commands/region/建筑/config";
import 制取配置 from "#/interfaces/commands/region/战略/特殊/config";
import { 格式化, 解析制取上下文 } from "#/interfaces/commands/region/战略/特殊/共享";
import { 更新玩家资料 } from "#ctx/player";
import { 更新地区战略资料 } from "#ctx/region";

/** 校验玩家资源是否满足消耗，不足时返回错误文本 */
function 校验资源充足(用户资料: any, 资源消耗: Record<string, number>): string | null {
    for (const [key, need] of Object.entries(资源消耗)) {
        const have = 用户资料[key] ?? 0;
        if (have < need) {
            return `资源不足：需要 ${key}${格式化(need)}，你拥有 ${格式化(have)}`;
        }
    }
    return null;
}

/** 构建扣除消耗后的玩家更新载荷 */
function 构建玩家更新(用户资料: any, 资源消耗: Record<string, number>): Record<string, number> {
    const 玩家更新: Record<string, number> = {};
    for (const [key, need] of Object.entries(资源消耗)) {
        玩家更新[key] = 用户资料[key] - need;
    }
    return 玩家更新;
}

/** 选择制取目标建筑：指定编号时校验存在/完工/空闲，否则自动挑选空闲已建成建筑 */
function 选择制取建筑(
    映射: Record<number, any>,
    建筑编号: number | undefined,
    生产力需求: number,
    显示名: string,
): { 编号: number } | { 错误: string } {
    if (Number.isFinite(Number(建筑编号))) {
        const 编号 = Math.max(1, Math.floor(Number(建筑编号) || 1));
        if (!映射[编号]) {
            return {
                错误: `建筑#${编号} 不存在，该地区${显示名}编号为：${Object.keys(映射)
                    .sort((a, b) => Number(a) - Number(b))
                    .join("、")}`,
            };
        }
        if (映射[编号].建造进度 < 生产力需求) {
            return { 错误: `建筑#${编号} 尚未建造完成，无法制取` };
        }
        if (映射[编号].是否制备中) {
            return { 错误: `建筑#${编号} 正在制取中，请选择空闲建筑` };
        }
        return { 编号 };
    }

    const 空闲已建成 = Object.entries(映射).find(
        ([, v]) => !v?.是否制备中 && v?.建造进度 >= 生产力需求,
    );
    if (!空闲已建成) {
        return { 错误: `该地区没有已建成且空闲的${显示名}，无法制取` };
    }
    return { 编号: Number(空闲已建成[0]) };
}

export function 制取地区资源(ctx: Context) {
    ctx.command("制取 <制取物:string> [建筑编号:number]")
        .alias("开始制取")
        .alias("制备")
        .action(async ({ session }, 制取物输入, 建筑编号) => {
            try {
                const 制取物 = 制取物输入?.trim();
                if (!制取物 || !(制取物 in 制取配置)) {
                    return `未知制取物，请选择：${Object.keys(制取配置).join("、")}`;
                }

                const 上下文 = await 解析制取上下文(ctx, session, 制取物, "发起制取");
                if ("错误" in 上下文) return 上下文.错误;
                const { id, username, 地区编号, 展示地区名称, 用户资料, 设施信息, 原始映射 } =
                    上下文;

                const 生产力需求 = 特殊建筑库[设施信息.设施类型].生产力需求;
                if (Object.keys(原始映射).length === 0) {
                    return `该地区暂无${设施信息.显示名}，请先修建`;
                }

                const 同类设施 = Object.entries(原始映射).map(([编号, 数据]) => ({
                    建筑编号: Number(编号),
                    ...(数据 as any),
                }));

                const 玩家制取中的 = 同类设施.find((设施) => {
                    const 最近日志 = (设施.日志 ?? []).slice(-1)[0];
                    return 设施.是否制备中 && 最近日志?.制备者 === username;
                });

                if (玩家制取中的) {
                    return `你正在${设施信息.显示名}#${玩家制取中的.建筑编号}制取中，请先完成当前制取`;
                }

                const 映射: Record<number, any> = { ...原始映射 };
                const 选择结果 = 选择制取建筑(映射, 建筑编号, 生产力需求, 设施信息.显示名);
                if ("错误" in 选择结果) {
                    return 选择结果.错误;
                }
                const 目标编号 = 选择结果.编号;

                const 设施 = 映射[目标编号];

                const cfg = (制取配置 as any)[制取物];
                const 资源消耗: Record<string, number> = cfg.资源消耗 ?? {};

                const 资源错误 = 校验资源充足(用户资料, 资源消耗);
                if (资源错误) return 资源错误;

                const 玩家更新 = 构建玩家更新(用户资料, 资源消耗);

                // 标记制备中并写入日志
                const 时间 = dayjs().format("YYYY-MM-DD HH:mm");

                const 日志项 = {
                    制备者: username,
                    制备物: 制取物,
                    数量: cfg.产出数量,
                    时间,
                };

                映射[目标编号] = {
                    ...设施,
                    是否制备中: true,
                    建造时间: 时间,
                    日志: [...(设施?.日志 ?? []), 日志项],
                };

                // 保存到数据库
                await Promise.all([
                    更新玩家资料(ctx, id, 玩家更新 as any),
                    更新地区战略资料(ctx, 地区编号, {
                        [设施信息.设施类型]: 映射,
                    } as any),
                ]);

                return [
                    "====[征战文游]====",
                    `${username} 同志：`,
                    `■ 地区：${展示地区名称}（${地区编号}）`,
                    `■ 建筑目标：#${目标编号}`,
                    `■ 制取目标：${制取物} x${格式化(cfg.产出数量)}`,
                    `■ 消耗：${Object.entries(资源消耗)
                        .map(([k, v]) => `${k}${格式化(v)}`)
                        .join("、")}`,
                    `■ 制取开始时间：${时间}`,
                    `■ 预计需要：${格式化(cfg.所需小时)} 小时`,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
