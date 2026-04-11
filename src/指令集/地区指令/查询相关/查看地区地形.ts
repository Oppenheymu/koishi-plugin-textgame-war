import {
    Context
} from "koishi";
import {
    玩家联军检查,
    地区解析,
    当前地区解析
} from "../../../utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 查看地区地形(ctx: Context) {
    ctx.command("查看地区地形 [地区编号:string]")
        .alias("查看城市地形")
        .alias("城市地形")
        .alias("城市地貌")
        .alias("地区地形")
        .alias("地区地貌")
        .action(async ({
            session
        }, 地区编号参数) => {
            try {
                const {
                    username
                } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 2,
                    是否必须在成员列表: true,
                });

                const 规范地区编号 = 地区编号参数?.trim();
                const {
                    地区编号,
                    地区地形资料
                } = 规范地区编号
                    ?
                    await 地区解析(ctx, 规范地区编号) :
                    await 当前地区解析(ctx, session);

                return `
【地区地形情报】
${username} 同志！
■ 地区编号: ${地区编号}
■ 海洋: ${地区地形资料.是否为海洋 ? "是" : "否"}
地区地形概况:
■ 平均海拔: ${格式化(地区地形资料.平均海拔)}
□ 最大海拔: ${格式化(地区地形资料.最大海拔)}
□ 最小海拔: ${格式化(地区地形资料.最小海拔)}
□ 地区崎岖度: ${格式化(地区地形资料.地区崎岖度)}
地区地貌占比：
□ 水域: ${地区地形资料.水域}%
□ 雪地: ${地区地形资料.雪地}%
□ 草地: ${地区地形资料.草地}%
□ 荒地: ${地区地形资料.荒地}%
□ 森林: ${地区地形资料.森林}%
□ 城镇: ${地区地形资料.城镇}%
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}