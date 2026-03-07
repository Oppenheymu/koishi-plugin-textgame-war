import { Context } from 'koishi';
import { 玩家检查 } from "../../Utils/index";



export function 我的地堡(ctx: Context) {
    ctx.command('我的地堡')
        .action(async ({ session }) => {
            try {

                const { username, 用户资料} = await 玩家检查(ctx, session);

                return `
====[我的地堡]====
${username} 同志：
■ 地下工厂：${用户资料.是否有地下工厂 ? '✓已建造' : '✗未建造'}
■ 地下机库：${用户资料.是否有地下机库 ? '✓已建造' : '✗未建造'}
■ 地下弹药库：${用户资料.是否有地下弹药库 ? '✓已建造' : '✗未建造'}

查看详情：我的地下工厂/机库/弹药库
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
