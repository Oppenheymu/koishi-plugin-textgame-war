import type { Context } from 'koishi';
import { 检查名称是否重复 } from '@/logic';
import type { Player, PlayerConfig, PlayerWarData } from '@/types';
import { TRandom, 会话检查, 用户检查, 获取注册Sqids } from '@/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

export function 注册(ctx: Context) {
    ctx.command('注册')
        .alias('首次阅读报告')
        .action(async ({ session }) => {
            try {
                会话检查(session);

                const { platform, userId } = 用户检查(session);

                const [已有玩家配置] = await ctx.database.get(
                    '马列玩家配置表',
                    {
                        [platform]: userId,
                    }
                );

                if (已有玩家配置) {
                    const [已有玩家档案列表, 已有玩家战争档案列表] =
                        await Promise.all([
                            ctx.database.get('马列玩家表', {
                                id: 已有玩家配置.id,
                            }),
                            ctx.database.get('马列玩家战争表', {
                                id: 已有玩家配置.id,
                            }),
                        ]);

                    const [已有玩家档案] = 已有玩家档案列表;
                    const [已有玩家战争档案] = 已有玩家战争档案列表;

                    if (已有玩家档案 && 已有玩家战争档案) {
                        return `同志，你已经注册过了（UID: ${已有玩家配置.uid}）`;
                    }

                    await Promise.all([
                        ctx.database.remove('马列玩家表', {
                            id: 已有玩家配置.id,
                        }),
                        ctx.database.remove('马列玩家战争表', {
                            id: 已有玩家配置.id,
                        }),
                        ctx.database.remove('马列玩家配置表', {
                            id: 已有玩家配置.id,
                        }),
                    ]);
                }

                let newID = 0;
                let newUID = '';
                let username = '';

                const 初始工人 = TRandom(4000, 12000, 16000);
                const 初始生活资料 = TRandom(8000, 50000, 90000);
                const 初始石油 = TRandom(50, 150, 800);
                const 初始钢铁 = TRandom(100, 200, 500);
                const 战争保护期时长 = TRandom(3, 7, 15);
                const 初始防空弹药 = TRandom(300, 1000, 2000);

                try {
                    const newPlayerConfig: PlayerConfig =
                        await ctx.database.create('马列玩家配置表', {
                            [platform]: userId,
                            username: '',
                            名称是否审核: true,
                        });

                    newID = newPlayerConfig.id;
                    newUID = 获取注册Sqids().encode([newID]);

                    const 初始名称 =
                        platform === 'onebot'
                            ? (session.username?.trim() ?? '')
                            : `默认名称${newUID}`;

                    username = 初始名称 || `默认名称${newUID}`;

                    const 重名类型 = await 检查名称是否重复(ctx, username, {
                        排除玩家ID: newID,
                    });
                    if (重名类型) {
                        username = `默认名称${newUID}`;
                    }

                    await ctx.database.set('马列玩家配置表', newID, {
                        uid: newUID,
                        username,
                    });

                    const newPlayerData: Player = {
                        id: newID,
                        uid: newUID,
                        所在联军: null,
                        驻扎地区: null,
                        上次驻扎日期: '',
                        上次炮击时间: null,
                        战争保护期:
                            Date.now() + 战争保护期时长 * 24 * 60 * 60 * 1000,
                        今日是否签到: true,
                        小时是否生产: false,
                        稳定度: 80,
                        生产次数: 1,
                        工人工资: 5,
                        工人招募限额: 1000,
                        生活资料: 初始生活资料,
                        生产技术: 10,
                        厂房: 10000,
                        工人: 初始工人,
                        地下工人: 0,
                        休假工人: 0,
                        科技等级: 1,
                        科技蓝图: 0,
                        科技池投入: 0,
                        科技池容量: 3000,
                        石油: 初始石油,
                        铝土矿: 0,
                        金属铝: 0,
                        铁矿石: 0,
                        钢铁: 初始钢铁,
                    };

                    const newPlayerWarData: PlayerWarData = {
                        id: newID,
                        uid: newUID,
                        私人军队: 0,
                        步兵装备: 0,
                        重炮: 0,
                        火箭炮: 0,
                        火箭炮弹药: 0,
                        防空弹药: 初始防空弹药,
                        侦察机: 0,
                        轰炸机: 0,
                        隐形轰炸机: 0,
                        大型运输机: 0,
                        小型运输机: 0,
                        预警机: 0,
                        巡航中的预警机: 0,
                        战斗机: 0,
                        巡航中的战斗机: 0,
                        地下工厂投入: 0,
                        是否有地下工厂: false,
                        地下机库投入: 0,
                        是否有地下机库: false,
                        地下弹药库投入: 0,
                        是否有地下弹药库: false,
                        地下飞机: 0,
                        地下隐形飞机: 0,
                        地下预警机: 0,
                        地下大型运输机: 0,
                        地下小型运输机: 0,
                        地下火箭炮炮弹: 0,
                        地下防空弹药: 0,
                    };

                    await Promise.all([
                        ctx.database.create('马列玩家表', newPlayerData),
                        ctx.database.create('马列玩家战争表', newPlayerWarData),
                    ]);
                } catch (error) {
                    if (newID) {
                        await Promise.allSettled([
                            ctx.database.remove('马列玩家表', {
                                id: newID,
                            }),
                            ctx.database.remove('马列玩家战争表', {
                                id: newID,
                            }),
                            ctx.database.remove('马列玩家配置表', {
                                id: newID,
                            }),
                        ]);
                    }
                    throw error;
                }

                return `
====[征战文游]====
${username} 同志 注册成功
□ 新玩家注册奖励:
■ 工人：${格式化(初始工人)}
■ 钢铁：${格式化(初始钢铁)}
■ 石油：${格式化(初始石油)}
■ 生活资料：${格式化(初始生活资料)}

□新手战争保护期：${战争保护期时长}天
发送[帮助]查看指令表
发送[词典]查看设定
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
