import type { Context } from "koishi";
import type { PlayerWarData } from "#ctx/player";
import { 玩家检查 } from "#ctx/player";
import { 格式化 } from "#shared/format";

export function 我的陆军装备(ctx: Context) {
    ctx.command("我的陆军装备")
        .alias("陆军装备")
        .action(async ({ session }) => {
            try {
                const { username, 用户资料 } = await 玩家检查(ctx, session);

                const 战争数据 = 用户资料 as unknown as PlayerWarData;

                return `
====[我的陆军装备]====
${username} 同志：
【基础】
■ 步兵装备：${格式化(战争数据.步兵装备)}
■ 卡车：${格式化(战争数据.卡车)}
【火炮】
■ 野战炮：${格式化(战争数据.野战炮)}
■ 火炮：${格式化(战争数据.火炮)}
■ 火箭炮：${格式化(战争数据.火箭炮)}
■ 列车炮：${格式化(战争数据.列车炮)}
【坦克】
■ 两栖坦克：${格式化(战争数据.两栖坦克)}
■ 轻型坦克：${格式化(战争数据.轻型坦克)}
■ 中型坦克：${格式化(战争数据.中型坦克)}
■ 重型坦克：${格式化(战争数据.重型坦克)}
■ 现代坦克：${格式化(战争数据.现代坦克)}
【支援车辆】
■ 装甲运兵车：${格式化(战争数据.装甲运兵车)}
■ 两栖装甲运兵车：${格式化(战争数据.两栖装甲运兵车)}
■ 坦克歼击车：${格式化(战争数据.坦克歼击车)}
■ 自行防空车：${格式化(战争数据.自行防空车)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
