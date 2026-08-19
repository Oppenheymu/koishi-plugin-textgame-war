import type { Context } from "koishi";
import { 构造邀请键, 联军邀请缓存 } from "#/interfaces/commands/coalition/生命周期/共享";
import { 尝试发送联军信号塔通报 } from "#ctx/beacon";
import { 玩家联军权限设置, 玩家联军检查 } from "#ctx/coalition";
import { 目标解析 } from "#shared/target";

const 邀请有效期毫秒 = 3 * 60 * 1000;

export function 邀请加入联军(ctx: Context) {
    ctx.command("邀请加入联军 <目标:string>")
        .alias("邀请入军")
        .alias("邀请加入国家")
        .action(async ({ session }, 目标) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(ctx, session, "邀请加入联军");
                const { username, 联军资料, 联军编号 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 权限等级需求,
                    是否必须在成员列表: true,
                });

                const 输入目标 = 目标?.trim();
                if (!输入目标) {
                    return "请指定目标用户：可以 @对方 或输入 UID";
                }

                const { 目标用户ID, 目标用户名, 目标用户资料 } = await 目标解析(
                    ctx,
                    session,
                    输入目标,
                );

                const 目标uid = 目标用户资料.uid;

                if (联军资料.联军成员列表?.[目标uid]) {
                    return `${目标用户名} 同志已在本联军中`;
                }

                if (目标用户资料.所在联军 && 目标用户资料.所在联军 !== 联军编号) {
                    return `${目标用户名} 同志已加入其他联军（${目标用户资料.所在联军}）`;
                }

                const 邀请键 = 构造邀请键(联军编号, 目标uid);
                const 当前时间戳 = Date.now();
                const 已有邀请 = 联军邀请缓存.get(邀请键);

                if (已有邀请 && 当前时间戳 < 已有邀请.过期时间戳) {
                    const 剩余秒数 = Math.ceil((已有邀请.过期时间戳 - 当前时间戳) / 1000);
                    return `${目标用户名} 同志已有待确认邀请，请等待对方同意（剩余约${剩余秒数}秒）`;
                }

                const 过期时间戳 = 当前时间戳 + 邀请有效期毫秒;
                联军邀请缓存.set(邀请键, {
                    联军编号,
                    联军名称: 联军资料.联军名称,
                    目标用户ID,
                    目标UID: 目标uid,
                    目标用户名,
                    邀请人用户名: username,
                    过期时间戳,
                });

                const 有效分钟 = Math.floor(邀请有效期毫秒 / 60000);

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: "联军外交通报",
                    通报内容: `${username} 已向 ${目标用户名} 发出加入联军邀请`,
                });

                return `
====[征战文游]====
${username} 同志！
已向 ${目标用户名} 发出联军邀请。
请对方在 ${有效分钟} 分钟内发送：同意加入联军 ${联军编号}
超时后邀请自动失效。
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
