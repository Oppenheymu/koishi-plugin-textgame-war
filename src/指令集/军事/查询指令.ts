import type { Context } from "koishi";
import {
    聚合军队面板,
    获取联军操作权限,
    计算地貌速度修正,
    计算战场宽度,
    计算攻击地形地貌修正,
} from "#/logic";
import {
    TerrainType,
    地形攻击修正,
    地形速度修正,
    战斗状态,
    组织度警告线,
    陆军装备名单,
} from "#/types";
import { 军队解析, 玩家检查, 玩家联军检查, 获取联军展示名称, 获取联军权限等级 } from "#/utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

async function 校验查看他国军队权限(
    ctx: Context,
    session: Parameters<typeof 玩家联军检查>[1],
    军队联军编号: string,
): Promise<string | null> {
    const { uid, 用户资料 } = await 玩家检查(ctx, session);
    if (用户资料.所在联军 === 军队联军编号) {
        return null;
    }
    if (!用户资料.所在联军) {
        return "你不在任何联军中，无法查看他国军队";
    }
    const [联军资料] = await ctx.database.get("马列联军表", {
        联军编号: 用户资料.所在联军,
    });
    if (!联军资料) {
        return "联军数据异常";
    }
    const 权限等级 = 获取联军权限等级(联军资料, uid);
    const 所需等级 = await 获取联军操作权限(ctx, 用户资料.所在联军, "查看地区军事");
    if (权限等级 < 所需等级) {
        return `查看他国军队需要本联军 ${所需等级} 级及以上权限`;
    }
    return null;
}

async function 获取用户名缓存(
    ctx: Context,
    uid列表: (string | null)[],
): Promise<Map<string, string>> {
    const 缓存 = new Map<string, string>();
    await Promise.all(
        Array.from(new Set(uid列表.filter(Boolean) as string[])).map(async (uid) => {
            const [配置] = await ctx.database.get("马列玩家配置表", {
                uid,
            });
            缓存.set(uid, 配置?.username ?? uid);
        }),
    );
    return 缓存;
}

export function 查看军队(ctx: Context) {
    ctx.command("查看军队 <编号:number>").action(async ({ session }, 编号) => {
        try {
            const 军队 = await 军队解析(ctx, 编号);
            const 权限拒绝 = await 校验查看他国军队权限(ctx, session, 军队.所属联军编号);
            if (权限拒绝) return 权限拒绝;

            const 面板 = 聚合军队面板(军队);
            const 用户名缓存 = await 获取用户名缓存(ctx, [军队.指挥官UID]);
            const 指挥官 = 军队.指挥官UID
                ? (用户名缓存.get(军队.指挥官UID) ?? 军队.指挥官UID)
                : "无主";

            const 装备明细 = 陆军装备名单
                .map((名) => {
                    const 持有 = 军队[名] ?? 0;
                    if (持有 <= 0) return null;
                    const 有效 = 面板.有效装备数[名] ?? 0;
                    return `  ${名}：${格式化(持有)}（有效 ${格式化(有效)}）`;
                })
                .filter(Boolean)
                .join("\n");

            return [
                `====[军队 #${军队.id}]====`,
                `■ 名称：${军队.名称}（第${军队.番号}军）`,
                `■ 所属联军：${军队.所属联军编号}`,
                `■ 指挥官：${指挥官}`,
                `■ 状态：${军队.状态}（${军队.所在地区编号}）`,
                `■ 当前命令：${军队.当前命令}`,
                "---- 兵力 ----",
                `■ 士兵：${格式化(军队.士兵数量)}（持枪 ${格式化(面板.持枪步兵)} / 无枪 ${格式化(面板.无枪士兵)}）`,
                `■ 经验值：${格式化(军队.经验值)}`,
                装备明细 ? `---- 装备（持有/有效）----\n${装备明细}` : "---- 装备 ----\n  （无）",
                "---- 面板（现算） ----",
                `■ 软攻 ${格式化(面板.软攻)} | 硬攻 ${格式化(面板.硬攻)}`,
                `■ 突破 ${格式化(面板.突破)} | 防御 ${格式化(面板.防御)}`,
                `■ 装甲 ${格式化(面板.装甲)} | 穿甲 ${格式化(面板.穿甲)}`,
                `■ 组织度 ${格式化(面板.组织度)}（当前 ${(军队.当前组织度比例 * 100).toFixed(0)}%）${面板.组织度 < 组织度警告线 ? " ⚠️ 一打就溃" : ""}`,
                `■ HP ${格式化(面板.HP)}（当前 ${(军队.当前HP比例 * 100).toFixed(0)}%）`,
                `■ 宽度 ${格式化(面板.宽度)} | 速度 ${格式化(面板.速度)} km/h${面板.是否摩托化 ? "（摩托化）" : ""}`,
                `■ 装甲率 ${(面板.硬度 * 100).toFixed(1)}%`,
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}

export function 军队列表(ctx: Context) {
    ctx.command("军队列表 [联军编号:string]").action(async ({ session }, 联军编号) => {
        try {
            const 结果 = await 玩家联军检查(ctx, session);
            const 目标联军编号 = 联军编号?.trim() || 结果.联军编号;

            if (目标联军编号 !== 结果.联军编号) {
                const 所需等级 = await 获取联军操作权限(ctx, 结果.联军编号, "查看地区军事");
                if (结果.权限等级 < 所需等级) {
                    return `查看他国军队列表需要本联军 ${所需等级} 级及以上权限`;
                }
            }

            const [联军资料] = await ctx.database.get("马列联军表", {
                联军编号: 目标联军编号,
            });
            if (!联军资料) {
                return `未找到联军：${目标联军编号}`;
            }

            const 军队列表 = await ctx.database.get("马列军队表", {
                所属联军编号: 目标联军编号,
            });
            if (军队列表.length === 0) {
                return `${获取联军展示名称(联军资料)} 当前没有军队`;
            }

            const 用户名缓存 = await 获取用户名缓存(
                ctx,
                军队列表.map((a) => a.指挥官UID),
            );

            const 行 = 军队列表
                .sort((a, b) => a.番号 - b.番号)
                .map((军队) => {
                    const 指挥官 = 军队.指挥官UID
                        ? (用户名缓存.get(军队.指挥官UID) ?? "未知")
                        : "无主";
                    return `■ #${军队.id} 第${军队.番号}军【${军队.状态}】${军队.名称} | 指挥官：${指挥官} | 兵力 ${格式化(军队.士兵数量)}`;
                });

            return [`====[${获取联军展示名称(联军资料)} 军队列表]====`, ...行].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}

export function 查看战斗(ctx: Context) {
    ctx.command("查看战斗 <地区编号:string>").action(async ({ session }, 地区编号) => {
        try {
            await 玩家检查(ctx, session);
            const 编号 = 地区编号?.trim();
            if (!编号) return "请指定地区编号";

            const [战斗] = await ctx.database.get("马列战斗表", {
                地区编号: 编号,
                状态: 战斗状态.进行中,
            });
            if (!战斗) {
                return `${编号} 地区当前没有进行中的战斗`;
            }

            const 参战军队 = await ctx.database.get("马列军队表", {
                当前战斗编号: 战斗.id,
            });
            const 用户名缓存 = await 获取用户名缓存(
                ctx,
                参战军队.map((a) => a.指挥官UID),
            );

            const 格式化一方 = (阵营: string) =>
                参战军队
                    .filter((a) => a.战斗阵营 === 阵营)
                    .map((军队) => {
                        const 指挥官 = 军队.指挥官UID
                            ? (用户名缓存.get(军队.指挥官UID) ?? "未知")
                            : "无主";
                        return `  ■ #${军队.id} 第${军队.番号}军（${指挥官}）组织度 ${(军队.当前组织度比例 * 100).toFixed(0)}%`;
                    })
                    .join("\n") || "  （无）";

            return [
                `====[${编号}地区 战斗概况]====`,
                `■ 回合数：${战斗.回合数}`,
                `■ 开始时间：${战斗.开始时间}`,
                `---- 进攻方（${战斗.进攻方联军编号}）----`,
                格式化一方("进攻"),
                `---- 防守方（${战斗.防守方联军编号}）----`,
                格式化一方("防守"),
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}

export function 军队详情(ctx: Context) {
    ctx.command("军队详情 <编号:number>")
        .alias("部队详情")
        .action(async ({ session }, 编号) => {
            try {
                const 军队 = await 军队解析(ctx, 编号);
                const 权限拒绝 = await 校验查看他国军队权限(ctx, session, 军队.所属联军编号);
                if (权限拒绝) return 权限拒绝;

                const 面板 = 聚合军队面板(军队);
                const 用户名缓存 = await 获取用户名缓存(ctx, [军队.指挥官UID]);
                const 指挥官 = 军队.指挥官UID
                    ? (用户名缓存.get(军队.指挥官UID) ?? 军队.指挥官UID)
                    : "无主";

                // 获取地区地形数据
                const [地区详情] = await ctx.database.get("马列地区表", {
                    地区编号: 军队.所在地区编号,
                });
                let 地形类型: TerrainType = TerrainType.平原;
                if (地区详情?.地区地形) {
                    地形类型 = 地区详情.地区地形 as TerrainType;
                }
                const [地区地形] = await ctx.database.get("马列地区地形表", {
                    地区编号: 军队.所在地区编号,
                });

                // 构造地貌数据（nullable fallback）
                const 水域 = 地区地形?.水域 ?? 0;
                const 雪地 = 地区地形?.雪地 ?? 0;
                const 草地 = 地区地形?.草地 ?? 0;
                const 荒地 = 地区地形?.荒地 ?? 0;
                const 森林 = 地区地形?.森林 ?? 0;
                const 城镇 = 地区地形?.城镇 ?? 0;
                const 地貌 = { 水域, 雪地, 草地, 荒地, 森林, 城镇 };

                // 计算地形修正
                const 地形攻 = 地形攻击修正[地形类型] ?? 1;
                const 地貌攻 = 计算攻击地形地貌修正(地形类型, 地貌);
                const 地貌速 = 计算地貌速度修正(地貌);
                const 地形速 = 地形速度修正[地形类型] ?? 1;
                const 实际战场宽度 = 计算战场宽度(地形类型, 地貌);

                const 地貌明细 = [
                    `  水域 ${水域.toFixed(2)}%  | 雪地 ${雪地.toFixed(2)}%`,
                    `  草地 ${草地.toFixed(2)}%  | 荒地 ${荒地.toFixed(2)}%`,
                    `  森林 ${森林.toFixed(2)}%  | 城镇 ${城镇.toFixed(2)}%`,
                ].join("\n");

                const 修正乘100 = (v: number) => `${(v * 100).toFixed(0)}%`;

                return [
                    `====[军队 #${军队.id} 详情]====`,
                    `■ 名称：${军队.名称}（第${军队.番号}军）`,
                    `■ 联军：${军队.所属联军编号} | 指挥官：${指挥官}`,
                    `■ 状态：${军队.状态} | 命令：${军队.当前命令}`,
                    "---- 兵力 ----",
                    `■ 士兵：${格式化(军队.士兵数量)}（持枪 ${格式化(面板.持枪步兵)} / 无枪 ${格式化(面板.无枪士兵)}）`,
                    `■ 经验值：${格式化(军队.经验值)}`,
                    "---- 攻击面板 ----",
                    `■ 软攻 ${格式化(面板.软攻)}  | 硬攻 ${格式化(面板.硬攻)}`,
                    `■ 突破 ${格式化(面板.突破)}  | 防御 ${格式化(面板.防御)}`,
                    `■ 装甲 ${格式化(面板.装甲)}  | 穿甲 ${格式化(面板.穿甲)}`,
                    `■ 宽度 ${格式化(面板.宽度)} | 速度 ${格式化(面板.速度)} km/h${面板.是否摩托化 ? "（摩托化）" : ""}`,
                    "---- 地形修正（所在地区） ----",
                    `■ 地区：${军队.所在地区编号}（${地形类型}）`,
                    `■ 战场宽度：${格式化(实际战场宽度)}${面板.宽度 > 实际战场宽度 ? ` ⚠️ 超宽 ${(面板.宽度 - 实际战场宽度).toFixed(0)}（惩罚 -${修正乘100(Math.min(0.33, (面板.宽度 - 实际战场宽度) / 实际战场宽度))}）` : ""}`,
                    `■ 攻击修正：基础 ${修正乘100(1)} × 地形 ${修正乘100(地形攻)} × 地貌 ${修正乘100(地貌攻 / 地形攻)} = ${修正乘100(地貌攻)}`,
                    ...(面板.是否摩托化
                        ? [
                              `■ 速度修正：基础 ${修正乘100(1)} × 地形 ${修正乘100(地形速)} × 地貌 ${修正乘100(地貌速)} × 摩托化 ${修正乘100(12 / 面板.速度)} = ${格式化(面板.速度 * 地形速 * 地貌速)} km/h（已摩托化）`,
                          ]
                        : [
                              `■ 速度修正：基础 ${修正乘100(1)} × 地形 ${修正乘100(地形速)} × 地貌 ${修正乘100(地貌速)} = ${格式化(面板.速度 * 地形速 * 地貌速)} km/h（步兵行军）`,
                          ]),
                    `■ 硬度 ${(面板.硬度 * 100).toFixed(1)}% | 组织度 ${格式化(面板.组织度)}`,
                    "---- 地貌占比 ----",
                    地貌明细,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
