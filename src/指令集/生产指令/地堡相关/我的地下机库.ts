import { Context } from 'koishi';
import { 玩家检查 } from "../../Utils/index";



export function 我的地下机库(ctx: Context) {
    ctx.command('我的地下机库')
        .action(async ({ session }) => {
            try {

                const { username, 用户资料} = await 玩家检查(ctx, session);

                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                return `
====[地下机库]====
${username} 同志：
■ 地下轰炸机：${格式化(用户资料.地下飞机)}
■ 地下预警机：${格式化(用户资料.地下预警机)}
■ 地下隐形轰炸机：${格式化(用户资料.地下隐形飞机)}
■ 地下大型运输机：${格式化(用户资料.地下大型运输机)}
■ 地下小型运输机：${格式化(用户资料.地下小型运输机)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
