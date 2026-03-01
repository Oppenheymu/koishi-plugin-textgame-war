import { Context } from "koishi";
import { requireSession, requireUser, TRandom } from "../../Utils/index";
import { Player } from "../../Types/Player";

export function 签到(ctx: Context) {
    ctx.command('签到').alias('阅读报告')
        .action(async ({ session }) => {

            requireSession(session);
            const { userId, username } = requireUser(session);
        
            try{
                const userInfo = await ctx.database.get('malieplayer', { userId: userId });

                if ( !userInfo || userInfo.length === 0 ) {

                    const 初始工人 = TRandom(40000, 16000, 120000);
                    const 初始生活资料 = TRandom(8000, 15000, 30000);
                    const 初始石油 = TRandom(500, 1500, 8000);
                    const 初始钢铁 = TRandom(10000, 20000, 50000);
                    const 战争保护期时长 = TRandom(3, 7, 15);
                    const 初始防空弹药 = TRandom(3000, 10000, 20000);


                    const newUser: Player = {
                        userId: userId,
                        今日是否签到: true,
                        战争保护期: ( Date.now() + 战争保护期时长 * 24 * 60 * 60 * 1000 ),
                        生活资料: 初始生活资料,
                        生产技术: 10,
                        工人: 初始工人,
                        地下工人: 0,
                        休假工人: 0,
                        科技等级: 0,
                        科技蓝图: 0,
                        科技池投入: 0,
                        科技池容量: 0,
                        石油: 初始石油,
                        铁矿石: 0,
                        钢铁: 初始钢铁,
                        私人军队: 0,
                        重炮: 0,
                        火箭炮: 0,
                        火箭炮弹药: 0,
                        防空弹药: 初始防空弹药,
                        飞机: 0,
                        隐形飞机: 0,
                        预警机: 0,
                        大型运输机: 0,
                        小型运输机: 0,
                        战斗机: 0,
                        巡航中的战斗机: 0,
                        地下飞机: 0,
                        地下隐形飞机: 0,
                        地下预警机: 0,
                        地下大型运输机: 0,
                        地下小型运输机: 0,
                        地下火箭炮炮弹: 0,
                        地下防空弹药: 0
                    }
                    await ctx.database.create('malieplayer', newUser);   
                    return `
====[征战文游]====
${username} 同志 签到成功
□ 新玩家注册奖励:
■ 工人：${初始工人}
■ 钢铁：${初始钢铁}
■ 石油：${初始石油}
■ 生活资料：${初始生活资料}

□新手战争保护期：${战争保护期时长}天
发送[帮助]查看指令表
发送[词典]查看设定
`.trim();
                } else if ( userInfo && userInfo.length > 0 ) {
                    // 处理已注册用户的签到/阅读报告
                    const 当前用户资料 = userInfo[0]! ;
                    if (当前用户资料?.今日是否签到 === true) {
                        return `
====[征战文游]====
${username} 同志！
您今天已签到过了！
`.trim();
                    } else {

                        const 增加的工人 = TRandom(300, 1000, 3000);
                        const 增加的石油 = TRandom(500, 1500, 2500);
                        const 增加的钢铁 = TRandom(800, 2000, 4000);
                        const 增加的生活资料 = TRandom(10000, 20000, 50000);
                        const 增加后的工人 = 当前用户资料.工人 + 增加的工人;
                        const 增加后的石油 = 当前用户资料.石油 + 增加的石油;
                        const 增加后的钢铁 = 当前用户资料.钢铁 + 增加的钢铁;
                        const 增加后的生活资料 = 当前用户资料.生活资料 + 增加的生活资料;

                        await ctx.database.set('malieplayer', { userId: userId }, {
                            今日是否签到: true,
                            工人: 增加后的工人,
                            石油: 增加后的石油,
                            钢铁: 增加后的钢铁,
                            生活资料: 增加后的生活资料
                        });

                        return `
===[征战文游]===
${username} 同志！
今日报告，获得物资：
■ 工人：+${增加的工人}
■ 石油：+${增加的石油}
■ 钢铁：+${增加的钢铁}
■ 生活资料：+${增加的生活资料}
`.trim();
                    }
                }
            } catch (error) {
                return (error as Error).message;
            }
        });
}