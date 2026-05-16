import type { Context } from 'koishi';

export function 加载玩家战争表(ctx: Context) {
    ctx.model.extend(
        '马列玩家战争表',
        {
            id: {
                type: 'unsigned',
            },

            // 混淆后的ID
            uid: {
                type: 'string',
                length: 255,
            },

            // 陆军
            步兵装备: {
                type: 'unsigned',
                initial: 0,
            },
            卡车: {
                type: 'unsigned',
                initial: 0,
            },
            火炮: {
                type: 'unsigned',
                initial: 0,
            },
            火箭炮: {
                type: 'unsigned',
                initial: 0,
            },
            列车炮: {
                type: 'unsigned',
                initial: 0,
            },

            // 空军
            侦察机: {
                type: 'unsigned',
                initial: 0,
            },
            战斗机: {
                type: 'unsigned',
                initial: 0,
            },
            预警机: {
                type: 'unsigned',
                initial: 0,
            },
            战术轰炸机: {
                type: 'unsigned',
                initial: 0,
            },
            战略轰炸机: {
                type: 'unsigned',
                initial: 0,
            },
            隐形轰炸机: {
                type: 'unsigned',
                initial: 0,
            },
            大型运输机: {
                type: 'unsigned',
                initial: 0,
            },
            小型运输机: {
                type: 'unsigned',
                initial: 0,
            },
            // 空军状态机
            巡航中的预警机: {
                type: 'unsigned',
                initial: 0,
            },
            巡航中的战斗机: {
                type: 'unsigned',
                initial: 0,
            },

            // 弹药相关
            火箭弹: {
                type: 'unsigned',
                initial: 0,
            },
            防空弹药: {
                type: 'unsigned',
                initial: 0,
            },
            轻型航弹: {
                type: 'unsigned',
                initial: 0,
            },
            重型航弹: {
                type: 'unsigned',
                initial: 0,
            },

            // 地堡相关
            地下工厂投入: {
                type: 'unsigned',
                initial: 0,
            },
            是否有地下工厂: {
                type: 'boolean',
                initial: false,
            },
            地下机库投入: {
                type: 'unsigned',
                initial: 0,
            },
            是否有地下机库: {
                type: 'boolean',
                initial: false,
            },
            地下弹药库投入: {
                type: 'unsigned',
                initial: 0,
            },
            是否有地下弹药库: {
                type: 'boolean',
                initial: false,
            },

            // 地下机库相关
            地下侦察机: {
                type: 'unsigned',
                initial: 0,
            },
            地下战斗机: {
                type: 'unsigned',
                initial: 0,
            },
            地下预警机: {
                type: 'unsigned',
                initial: 0,
            },
            地下战术轰炸机: {
                type: 'unsigned',
                initial: 0,
            },
            地下战略轰炸机: {
                type: 'unsigned',
                initial: 0,
            },
            地下隐形轰炸机: {
                type: 'unsigned',
                initial: 0,
            },
            地下大型运输机: {
                type: 'unsigned',
                initial: 0,
            },
            地下小型运输机: {
                type: 'unsigned',
                initial: 0,
            },

            // 地下弹药库相关
            地下火箭弹: {
                type: 'unsigned',
                initial: 0,
            },
            地下防空弹药: {
                type: 'unsigned',
                initial: 0,
            },
        },
        {
            // 表配置
            primary: 'id',
            unique: ['uid'],
        }
    );
}
