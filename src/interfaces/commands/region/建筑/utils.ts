import type { Context, Session } from "koishi";
import { 计算资源总消耗 } from "#ctx/region/domain/construction/建造工具";
import { 计算最大可执行轮次 as 计算最大可执行轮次工具 } from "#ctx/region/domain/construction/建造工具";
import type { Player } from "#ctx/player/domain/types/基本类型";
import { 更新玩家资料 } from "#ctx/player/domain/更新";
import { 玩家检查 } from "#ctx/player/domain/守卫";
import { 驻扎检查 } from "#ctx/region/domain/守卫";
import { 格式化 } from "#shared/format";
import type { 特殊设施类型, 设施建造对象, 资源需求配置 } from "#/interfaces/commands/region/建筑/config";

// 格式化工具统一由 #/utils 提供，此处 re-export 保持下游引用不变
export { 格式化 } from "#shared/format";

// ==================== 轮次处理 ====================
export function 解析轮次(轮次输入: number | undefined): number {
    const 轮次 = Number.isFinite(轮次输入) ? Math.floor(轮次输入 as number) : 1;
    return 轮次 > 0 ? 轮次 : 0;
}

// ==================== 资源计算 ====================
/**
 * 资源总消耗
 * 直接使用建造工具中的函数
 */
export { 计算资源总消耗 as 资源总消耗 };

/**
 * 计算最大可执行轮次（包装为指令层格式）
 */
export function 计算最大可执行轮次(
    用户资料: Player,
    资源需求: 资源需求配置 | undefined,
    请求轮次: number,
): number {
    const 单轮工资 = 用户资料.工人 * 用户资料.工人工资;

    return 计算最大可执行轮次工具({
        请求轮次,
        玩家生产次数: 用户资料.生产次数,
        单轮工资,
        当前生活资料: 用户资料.生活资料,
        玩家资源: {
            钢铁: 用户资料.钢铁,
            金属铝: 用户资料.金属铝,
        },
        资源需求: 资源需求 as Record<string, number>,
    });
}

// ==================== 设施对象创建 ====================
export function 创建默认设施对象(_类型: 特殊设施类型): 设施建造对象 {
    return {
        是否制备中: false,
        建造进度: 0,
        建造时间: "",
        日志: [],
    };
}

// ==================== 资源与工资结算 ====================
export async function 执行资源与工资结算(
    ctx: Context,
    玩家id: number,
    用户资料: Player,
    轮次: number,
    资源需求: 资源需求配置,
) {
    const 单轮工资 = 用户资料.工人 * 用户资料.工人工资;
    const 工资消耗 = 单轮工资 * 轮次;
    const 资源消耗 = 计算资源总消耗(资源需求, 轮次);

    await 更新玩家资料(ctx, 玩家id, {
        钢铁: 用户资料.钢铁 - (资源消耗["钢铁"] ?? 0),
        金属铝: 用户资料.金属铝 - (资源消耗["金属铝"] ?? 0),
        生活资料: 用户资料.生活资料 - 工资消耗,
        生产次数: 用户资料.生产次数 - 轮次,
    });

    return {
        工资消耗,
        资源消耗,
    };
}

// ==================== 文本组装 ====================
export function 组装消耗文本(资源消耗: 资源需求配置): string[] {
    const 文本: string[] = [];
    if ((资源消耗["钢铁"] ?? 0) > 0) {
        文本.push(`■ 钢铁消耗：${格式化(资源消耗["钢铁"] ?? 0)}`);
    }
    if ((资源消耗["金属铝"] ?? 0) > 0) {
        文本.push(`■ 金属铝消耗：${格式化(资源消耗["金属铝"] ?? 0)}`);
    }
    return 文本;
}

// ==================== 预检查验证 ====================
export async function 执行预检查(ctx: Context, session: Session | undefined, 操作名: string) {
    const { id, username, 当前驻扎地区, 地区编号, 展示地区名称, 地区战略资料 } = await 驻扎检查(
        ctx,
        session,
    );
    const { 用户资料 } = await 玩家检查(ctx, session);

    if (当前驻扎地区 !== 地区编号) {
        throw new Error(
            `你当前驻扎在 ${当前驻扎地区 || "未驻扎地区"}，仅驻扎在本地区的玩家可${操作名}`,
        );
    }

    if (用户资料.生产次数 <= 0) {
        throw new Error("生产次数不足");
    }

    if (用户资料.工人 * 用户资料.生产技术 <= 0) {
        throw new Error("当前生产力为零，无法修建");
    }

    return { id, username, 地区编号, 展示地区名称, 地区战略资料, 用户资料 };
}
