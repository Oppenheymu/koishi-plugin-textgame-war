import { Context } from 'koishi';

/**
 * 初始化地区地形数据表
 */
export function 加载地区地形表(ctx: Context) {
    ctx.model.extend('马列地区地形表', {

        地区编号: { type: 'string', length: 255 },
        地区横轴坐标: { type: 'integer' },
        地区纵轴坐标: { type: 'integer' },

        是否为海洋: { type: 'boolean' },

        平均海拔: { type: 'integer' },
        最大海拔: { type: 'integer' },
        最小海拔: { type: 'integer' },
        地区崎岖度: { type: 'integer' },

        水域: { type: 'integer' },
        雪地: { type: 'integer' },
        草地: { type: 'integer' },
        荒地: { type: 'integer' },
        森林: { type: 'integer' },
        城镇: { type: 'integer' },

    }, {
        // 表配置
        primary: '地区编号',
    });
}
