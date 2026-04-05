import { Context } from "koishi";
import { 地区解析, 用户检查, 玩家联军检查 } from "../../utils";

export function 绑定地区(ctx: Context) {
    ctx.command("绑定地区 <地区编号:string>").action(async ({ session }, 地区编号) => {
        try {
            const { 联军资料, username } = await 玩家联军检查(ctx, session, {
                最低权限等级: 1,
                是否必须在成员列表: true,
            });

            const 规范地区编号 = 地区编号?.trim();
            if (!规范地区编号) {
                return "请提供地区编号";
            }

            const { platform, userId } = 用户检查(session);
            const { 地区编号: 目标地区编号, 地区配置资料 } = await 地区解析(
                ctx,
                规范地区编号,
            );

            if (!联军资料.联军地区列表.includes(目标地区编号)) {
                return "只能绑定本联军控制地区";
            }

            const 已绑定用户 = 地区配置资料[platform as "onebot" | "discord" | "telegram"];
            if (已绑定用户 && 已绑定用户 !== userId) {
                return "该地区在当前平台已绑定其他账号";
            }

            await ctx.database.set(
                "马列地区配置表",
                { 地区编号: 目标地区编号 },
                { [platform]: userId },
            );

            return `
====[征战文游]====
${username} 同志！
地区绑定成功：${目标地区编号}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
