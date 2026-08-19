/** biome-ignore-all lint/suspicious/noExplicitAny: 战略资料为动态结构 */

export { 格式化 } from "#shared/format";

/** 制取/提取指令共享逻辑 */
import type { Context, Session } from "koishi";
import type { 特殊设施类型 } from "#/interfaces/commands/region/建筑/config";
import { 地区查询权限检查, 驻扎检查 } from "#ctx/region";

export interface 制取物信息 {
    设施类型: 特殊设施类型;
    显示名: string;
    权限动作: "查看地区生物实验室" | "查看地区离心机组" | "查看地区核反应堆";
}

/** 制取物 → 设施类型 / 显示名 / 权限动作 统一映射 */
const 制取物设施映射: Record<string, 制取物信息> = {
    生物武器: {
        设施类型: "生物实验室",
        显示名: "生物实验室",
        权限动作: "查看地区生物实验室",
    },
    浓缩铀: {
        设施类型: "高速离心级联",
        显示名: "高速离心级联",
        权限动作: "查看地区离心机组",
    },
    钚: {
        设施类型: "核反应堆",
        显示名: "核反应堆",
        权限动作: "查看地区核反应堆",
    },
};

type 驻扎结果 = Awaited<ReturnType<typeof 驻扎检查>>;

/** 制取/提取共用的前置上下文：驻扎与玩家守卫、设施映射、地区权限、既有设施映射 */
export type 制取上下文 =
    | { 错误: string }
    | {
          id: 驻扎结果["id"];
          username: 驻扎结果["username"];
          地区编号: 驻扎结果["地区编号"];
          展示地区名称: 驻扎结果["展示地区名称"];
          用户资料: 驻扎结果["用户资料"];
          设施信息: 制取物信息;
          原始映射: Record<number, any>;
      };

export async function 解析制取上下文(
    ctx: Context,
    session: Session | undefined,
    制取物: string,
    动作词: string,
): Promise<制取上下文> {
    const 驻扎 = await 驻扎检查(ctx, session);

    if (驻扎.当前驻扎地区 !== 驻扎.地区编号) {
        return {
            错误: `你当前驻扎在 ${驻扎.当前驻扎地区 || "未驻扎地区"}，仅驻扎在本地区的玩家可${动作词}`,
        };
    }

    const 设施信息 = 制取物设施映射[制取物];
    if (!设施信息) {
        return { 错误: `未知制取物：${制取物}` };
    }

    await 地区查询权限检查(ctx, session, 设施信息.权限动作 as any, 驻扎.地区编号);

    return {
        id: 驻扎.id,
        username: 驻扎.username,
        地区编号: 驻扎.地区编号,
        展示地区名称: 驻扎.展示地区名称,
        用户资料: 驻扎.用户资料,
        设施信息,
        原始映射: (驻扎.地区战略资料[设施信息.设施类型] ?? {}) as Record<number, any>,
    };
}
