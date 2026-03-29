//src/commandC/Buildcountry.ts

import { Context } from "koishi";
import {} from "koishi-plugin-am-i-alt";
import Hashids from "hashids";
import { CoalitionArmy } from "../../Types";
import { 玩家检查, TRandom } from "../../Utils/";

export function BuildCoalitionArmy(ctx: Context) {
    ctx.command("组建联军 <联军名称:string>")
        .alias("创建国家")
        .alias("建国")
        .action(async ({ session }) => {
            try {
                const { id, username, 用户资料 } = await 玩家检查(ctx, session);
                if ((await ctx.amIAlt.isAlt(session)) == true)
                    return "疑似小号禁止组建联军";
            } catch (error) {
                return (error as Error).message;
            }
        });
}
