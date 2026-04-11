import {
    Context
} from "koishi";
import {
    目标联军解析
} from "../../../utils";

export function 他的联军(ctx: Context) {
    ctx.command("他的联军 <目标:string>")
        .alias("查看他的联军")
        .alias("他的国家")
        .action(async ({
            session
        }, 目标) => {
            try {
                const {
                    目标用户名,
                    联军资料,
                    展示联军名称
                } =
                await 目标联军解析(ctx, session, 目标);
                const 格式化 = (n: number) => n.toLocaleString("zh-CN");

                return `
====[征战文游]====
${目标用户名} 同志的联军信息：
■ 联军名称：${展示联军名称}
■ 联军编号：${联军资料.联军编号}
■ 联军成员：${格式化(联军资料.联军成员数量)}
■ 联军军队：${格式化(联军资料.联军军队)}
■ 联军首都：${联军资料.联军首都}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}