import type { Context, Session } from "koishi";
import { 审核通过改名工单, 审核驳回改名工单, 解析引用工单编号 } from "#ctx/naming/工单服务";

function 获取引用文本(session: Session | undefined): string | undefined {
    const quote = (
        session as Session & {
            quote?: {
                content?: string;
            };
        }
    )?.quote;
    return quote?.content;
}

function 解析工单编号(session: Session | undefined, 工单编号?: number | string): number | null {
    if (typeof 工单编号 === "number") {
        if (Number.isInteger(工单编号) && 工单编号 > 0) {
            return 工单编号;
        }
    }

    if (typeof 工单编号 === "string") {
        const 文本编号 = Number(工单编号.trim());
        if (Number.isInteger(文本编号) && 文本编号 > 0) {
            return 文本编号;
        }
    }

    const 引用文本 = 获取引用文本(session);
    return 解析引用工单编号(引用文本);
}

export function 名称审核(ctx: Context) {
    ctx.command("审核通过 [工单编号:text]", {
        authority: 3,
    }).action(async ({ session }, 工单编号) => {
        try {
            const 目标工单编号 = 解析工单编号(session, 工单编号);
            if (!目标工单编号) {
                return "请提供工单编号，或引用改名工单消息后发送【审核通过】";
            }

            return await 审核通过改名工单(ctx, 目标工单编号);
        } catch (error) {
            return (error as Error).message;
        }
    });
    ctx.command("审核驳回 [工单编号:text] [原因:text]", {
        authority: 3,
    }).action(async ({ session }, 工单编号, 原因) => {
        try {
            const 目标工单编号 = 解析工单编号(session, 工单编号);
            if (!目标工单编号) {
                return "请提供工单编号，或引用改名工单消息后发送【审核驳回】";
            }

            return 审核驳回改名工单(目标工单编号, 原因);
        } catch (error) {
            return (error as Error).message;
        }
    });
}
