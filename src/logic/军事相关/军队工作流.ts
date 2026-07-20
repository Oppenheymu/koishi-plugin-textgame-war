// 军队工作流（详见 军事系统.prompt.md 第 7 章指令的业务部分）
import type { Context } from "koishi";
import type {
    Army,
    CoalitionArmy,
    Player,
    PlayerWarData,
    装备名,
} from "#/types";
import { 军衔, 军衔权益表, 军队命令, 军队状态, 是否有效装备名 } from "#/types";
import {
    地区解析,
    更新玩家资料,
    校验指挥与命令覆盖,
    获取玩家军队列表,
    获取联军军衔记录,
} from "#/utils";
import { 创建改名审核工单, 校验名称文本 } from "../改名审核";
import { 聚合军队面板 } from "./属性聚合";
import { 校验进军目标, 计算行军毫秒数 } from "./行军计算";

type 玩家完整资料 = Player & PlayerWarData;

export interface 军队操作者 {
    id: number;
    uid: string;
    username: string;
    用户资料: 玩家完整资料;
    权限等级: number;
}

// ---- 组建军队 ----

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
        throw new Error(
            "无法确定军队驻地：你尚未驻扎任何地区，且联军未设置首都",
        );
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
    const 番号 =
        联军军队.reduce((最大, 军队) => Math.max(最大, 军队.番号), 0) + 1;

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
            throw new Error(
                `军队已按默认名称组建，但自定义名称无效：${校验错误}`,
            );
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

// ---- 解散军队 ----

export async function 解散军队工作流(
    ctx: Context,
    军队: Army,
    操作者: 军队操作者,
): Promise<void> {
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("只有驻扎状态的军队才能解散");
    }

    // 装备与士兵回收：优先返还指挥官，无主军队由操作者回收（政治接管，可调）
    const 回收者UID = 军队.指挥官UID ?? 操作者.uid;
    const [回收者配置] = await ctx.database.get("马列玩家配置表", {
        uid: 回收者UID,
    });
    if (!回收者配置) {
        throw new Error("回收者账号数据异常，无法解散");
    }

    const [[战争档案], [玩家档案]] = await Promise.all([
        ctx.database.get("马列玩家战争表", { id: 回收者配置.id }),
        ctx.database.get("马列玩家表", { id: 回收者配置.id }),
    ]);

    const 回收更新: Record<string, number> = {};
    for (const 键 of 军队装备列名单) {
        const 数量 = 军队[键] as number;
        if (数量 > 0) {
            回收更新[键] =
                (Number(战争档案?.[键 as keyof PlayerWarData]) || 0) + 数量;
        }
    }
    if (军队.士兵数量 > 0) {
        回收更新["工人"] = (玩家档案?.工人 ?? 0) + 军队.士兵数量;
    }

    await 更新玩家资料(
        ctx,
        回收者配置.id,
        回收更新 as Partial<Player & PlayerWarData>,
    );
    await ctx.database.remove("马列军队表", { id: 军队.id });
}

// ---- 军队命名 ----

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

// ---- 分配装备（正数=库存拨给军队；负数=军队返还库存）----

export async function 分配装备工作流(
    ctx: Context,
    军队: Army,
    操作者: 军队操作者,
    装备名: string,
    数量: number,
): Promise<{ 实际数量: number }> {
    if (军队.指挥官UID !== 操作者.uid) {
        throw new Error("只有指挥官本人才能为军队分配装备");
    }
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("战场上无法补给：只有驻扎状态的军队才能调整装备");
    }
    if (!是否有效装备名(装备名)) {
        throw new Error(`未知装备：${装备名}`);
    }
    if (!Number.isInteger(数量) || 数量 === 0) {
        throw new Error("请输入非零整数数量（正数拨出，负数回收）");
    }

    const 键 = 装备名 as 装备名;
    const 军队持有 = Number(军队[键]) || 0;
    const 玩家持有 = Number(操作者.用户资料[键]) || 0;

    if (数量 > 0) {
        const 实际数量 = Math.min(数量, 玩家持有);
        if (实际数量 <= 0) {
            throw new Error(`你的库存中没有【${装备名}】可分配`);
        }
        await Promise.all([
            更新玩家资料(ctx, 操作者.id, {
                [键]: 玩家持有 - 实际数量,
            } as Partial<Player & PlayerWarData>),
            ctx.database.set(
                "马列军队表",
                { id: 军队.id },
                {
                    [键]: 军队持有 + 实际数量,
                },
            ),
        ]);
        return { 实际数量 };
    }

    const 回收数量 = Math.min(-数量, 军队持有);
    if (回收数量 <= 0) {
        throw new Error(`军队中没有【${装备名}】可回收`);
    }
    await Promise.all([
        更新玩家资料(ctx, 操作者.id, {
            [键]: 玩家持有 + 回收数量,
        } as Partial<Player & PlayerWarData>),
        ctx.database.set(
            "马列军队表",
            { id: 军队.id },
            {
                [键]: 军队持有 - 回收数量,
            },
        ),
    ]);
    return { 实际数量: -回收数量 };
}

// ---- 扩军 / 裁军（直接扣/还指挥官自己的工人）----

export async function 扩军工作流(
    ctx: Context,
    军队: Army,
    操作者: 军队操作者,
    人力: number,
): Promise<void> {
    if (军队.指挥官UID !== 操作者.uid) {
        throw new Error("只有指挥官本人才能扩军");
    }
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("战场上无法补充人力：只有驻扎状态的军队才能扩军");
    }
    if (!Number.isInteger(人力) || 人力 <= 0) {
        throw new Error("请输入正整数人力");
    }

    // 单军兵力上限（按指挥官军衔）
    const 军衔记录 = await 获取联军军衔记录(ctx, 军队.所属联军编号, 操作者.uid);
    const 上限 = 军衔记录 ? 军衔权益表[军衔记录.军衔].单军兵力上限 : 0;
    if (军队.士兵数量 + 人力 > 上限) {
        throw new Error(
            `超出单军兵力上限（${上限}）：当前 ${军队.士兵数量}，最多再扩 ${Math.max(0, 上限 - 军队.士兵数量)}`,
        );
    }

    if (操作者.用户资料.工人 < 人力) {
        throw new Error(`工人不足：需要 ${人力}，现有 ${操作者.用户资料.工人}`);
    }

    await Promise.all([
        更新玩家资料(ctx, 操作者.id, {
            工人: 操作者.用户资料.工人 - 人力,
        }),
        ctx.database.set(
            "马列军队表",
            { id: 军队.id },
            {
                士兵数量: 军队.士兵数量 + 人力,
            },
        ),
    ]);
}

export async function 裁军工作流(
    ctx: Context,
    军队: Army,
    操作者: 军队操作者,
    人力: number,
): Promise<{ 实际裁减: number }> {
    if (军队.指挥官UID !== 操作者.uid) {
        throw new Error("只有指挥官本人才能裁军");
    }
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("只有驻扎状态的军队才能裁军");
    }
    if (!Number.isInteger(人力) || 人力 <= 0) {
        throw new Error("请输入正整数人力");
    }

    const 实际裁减 = Math.min(人力, 军队.士兵数量);
    if (实际裁减 <= 0) {
        throw new Error("该军队没有士兵可裁减");
    }

    await Promise.all([
        更新玩家资料(ctx, 操作者.id, {
            工人: 操作者.用户资料.工人 + 实际裁减,
        }),
        ctx.database.set(
            "马列军队表",
            { id: 军队.id },
            {
                士兵数量: 军队.士兵数量 - 实际裁减,
            },
        ),
    ]);
    return { 实际裁减 };
}

// ---- 进军 ----

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

// ---- 下达命令（撤退 / 死守 / 取消死守）----

export async function 下达命令工作流(
    ctx: Context,
    军队: Army,
    命令: 军队命令,
    操作者UID: string,
): Promise<void> {
    if (军队.状态 !== 军队状态.战斗中) {
        throw new Error("只有战斗中的军队才能下达战斗命令");
    }

    const { 操作者军衔 } = await 校验指挥与命令覆盖(ctx, 军队, 操作者UID);

    await ctx.database.set(
        "马列军队表",
        { id: 军队.id },
        {
            当前命令: 命令,
            命令下达者军衔: 操作者军衔,
        },
    );
}

// ---- 任命指挥官（政治权限在指令层校验，此处只做军事校验）----

export async function 任命指挥官工作流(
    ctx: Context,
    军队: Army,
    目标UID: string,
    目标名称: string,
): Promise<void> {
    if (军队.指挥官UID) {
        throw new Error("该军队已有指挥官，无需任命（如需更换请先褫夺其军衔）");
    }

    // 被任命者需持有军衔且通过建军数量校验
    const 军衔记录 = await 获取联军军衔记录(ctx, 军队.所属联军编号, 目标UID);
    if (!军衔记录) {
        throw new Error(`${目标名称} 没有军衔，无法担任指挥官`);
    }

    const 权益 = 军衔权益表[军衔记录.军衔];
    const 已有军队 = await 获取玩家军队列表(ctx, 军队.所属联军编号, 目标UID);
    if (已有军队.length >= 权益.可建军数量) {
        throw new Error(
            `${目标名称} 的军队数量已达其军衔上限（${权益.可建军数量} 支）`,
        );
    }

    await ctx.database.set(
        "马列军队表",
        { id: 军队.id },
        {
            指挥官UID: 目标UID,
        },
    );
}

/** 军队表装备数量列（解散回收用，含空军/弹药占位列） */
const 军队装备列名单 = [
    "步兵装备",
    "卡车",
    "两栖坦克",
    "轻型坦克",
    "中型坦克",
    "重型坦克",
    "现代坦克",
    "装甲运兵车",
    "两栖装甲运兵车",
    "坦克歼击车",
    "自行防空车",
    "野战炮",
    "火炮",
    "火箭炮",
    "列车炮",
    "侦察机",
    "战斗机",
    "预警机",
    "战术轰炸机",
    "战略轰炸机",
    "隐形轰炸机",
    "大型运输机",
    "小型运输机",
    "火箭弹",
    "防空弹药",
    "轻型航弹",
    "重型航弹",
] as const;
