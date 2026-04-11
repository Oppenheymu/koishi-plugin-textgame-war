import {
    Context
} from "koishi";
import {
    玩家联军检查,
    玩家联军权限设置
} from "../../../utils";

export function 成员列表(ctx: Context) {
    ctx.command("成员列表")
        .alias("联军成员列表")
        .alias("国家成员列表")
        .alias("联军成员")
        .alias("国家成员")
        .action(async ({
            session
        }) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(
                    ctx,
                    session,
                    "成员列表"
                );
                const {
                    username,
                    联军资料
                } = await 玩家联军检查(
                    ctx,
                    session, {
                        最低权限等级: 权限等级需求,
                        是否必须在成员列表: true,
                    }
                );

                const 成员列表 = Object.keys(联军资料.联军成员列表 ?? {});

                return `
====[征战文游]====
${username} 同志：
联军成员列表:
${
    成员列表.length
        ? 成员列表.map((成员) => `    - ${成员}`).join("\n")
        : "    -暂无成员"
}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}