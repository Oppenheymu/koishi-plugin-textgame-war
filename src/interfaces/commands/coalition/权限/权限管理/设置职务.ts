import type { Context } from "koishi";
import { 目标解析 } from "#/interfaces/commands/common/target";
import { 尝试发送联军信号塔通报 } from "#ctx/beacon";
import type { CoalitionPermissionLevel } from "#ctx/coalition";
import { 玩家联军检查, 联军政体, 获取联军成员权限等级 } from "#ctx/coalition";

/** 单一政体下的职务任命规则（操作者/目标权限门槛，极权制可标记仅元首） */
interface 政体职务规则 {
    操作者所需: CoalitionPermissionLevel;
    目标所需: CoalitionPermissionLevel;
    目标精确匹配: boolean; // true = 目标权限必须恰好等于；false = 大于等于
    仅元首?: boolean;
}

interface 职务设置配置 {
    指令名: string;
    职务名: string;
    职务字段: "联军总理" | "联军元首";
    最低操作权限: CoalitionPermissionLevel;
    政体规则: Record<联军政体, 政体职务规则>;
}

const 职务配置列表: 职务设置配置[] = [
    {
        指令名: "设置总理",
        职务名: "总理",
        职务字段: "联军总理",
        最低操作权限: 3,
        政体规则: {
            [联军政体.民主制]: {
                操作者所需: 3,
                目标所需: 3,
                目标精确匹配: false,
            },
            [联军政体.威权制]: {
                操作者所需: 4,
                目标所需: 4,
                目标精确匹配: true,
            },
            [联军政体.极权制]: {
                操作者所需: 4,
                目标所需: 4,
                目标精确匹配: true,
                仅元首: true,
            },
        },
    },
    {
        指令名: "设置元首",
        职务名: "元首",
        职务字段: "联军元首",
        最低操作权限: 4,
        政体规则: {
            [联军政体.民主制]: {
                操作者所需: 4,
                目标所需: 4,
                目标精确匹配: true,
            },
            [联军政体.威权制]: {
                操作者所需: 4,
                目标所需: 4,
                目标精确匹配: true,
            },
            [联军政体.极权制]: {
                操作者所需: 4,
                目标所需: 4,
                目标精确匹配: true,
                仅元首: true,
            },
        },
    },
];

function 校验政体职务规则(参数: {
    规则: 政体职务规则;
    政体名: string;
    职务名: string;
    操作者权限: number;
    目标权限: number;
    是否元首本人: boolean;
}): string | null {
    const { 规则, 政体名, 职务名, 操作者权限, 目标权限, 是否元首本人 } = 参数;

    if (规则.仅元首 && !是否元首本人) {
        return `${政体名}下，仅元首可以设置${职务名}`;
    }
    if (操作者权限 < 规则.操作者所需) {
        return `${政体名}下仅${规则.操作者所需}级权限成员可以设置${职务名}`;
    }
    if (规则.目标精确匹配 ? 目标权限 !== 规则.目标所需 : 目标权限 < 规则.目标所需) {
        return 规则.目标精确匹配
            ? `${政体名}下，只能设置${规则.目标所需}级权限成员为${职务名}`
            : `${政体名}下，${职务名}目标至少需要${规则.目标所需}级权限`;
    }
    return null;
}

const 政体名称: Record<联军政体, string> = {
    [联军政体.民主制]: "民主制",
    [联军政体.威权制]: "威权制",
    [联军政体.极权制]: "极权制",
};

function 注册职务设置指令(ctx: Context, 配置: 职务设置配置) {
    ctx.command(`${配置.指令名} <目标:string>`).action(async ({ session }, 目标) => {
        try {
            const { uid, username, 联军资料, 联军编号, 权限等级 } = await 玩家联军检查(
                ctx,
                session,
                {
                    最低权限等级: 配置.最低操作权限,
                    是否必须在成员列表: true,
                },
            );

            const 输入目标 = 目标?.trim();
            if (!输入目标) {
                return "请指定目标用户：可以 @对方 或输入 UID";
            }

            const { 目标用户名, 目标用户资料 } = await 目标解析(ctx, session, 输入目标);

            const 目标UID = 目标用户资料.uid;
            if (目标UID === uid) {
                return "不能设置自己为目标";
            }
            if (目标用户资料.所在联军 !== 联军编号) {
                return `${目标用户名} 同志不在你的联军中`;
            }

            const 目标权限等级 = 获取联军成员权限等级(联军资料, 目标UID);
            const 政体 = 联军资料.联军政治体制;

            const 拒绝原因 = 校验政体职务规则({
                规则: 配置.政体规则[政体],
                政体名: 政体名称[政体],
                职务名: 配置.职务名,
                操作者权限: 权限等级,
                目标权限: 目标权限等级,
                是否元首本人: 联军资料.联军元首 === uid,
            });
            if (拒绝原因) {
                return 拒绝原因;
            }

            await ctx.database.set(
                "征战联军表",
                { 联军编号 },
                {
                    [配置.职务字段]: 目标UID,
                },
            );

            await 尝试发送联军信号塔通报(ctx, {
                联军编号,
                通报标题: "联军政务通报",
                通报内容: `${username} 已任命 ${目标用户名} 为联军${配置.职务名}`,
            });

            return `
====[征战文游]====
${username} 同志！
已将 ${目标用户名} 设置为联军${配置.职务名}
■ 联军编号：${联军编号}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}

export function 设置职务(ctx: Context) {
    for (const 配置 of 职务配置列表) {
        注册职务设置指令(ctx, 配置);
    }
}
