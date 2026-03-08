import { Context } from 'koishi';

/**
 * 初始化全球数据表
 */
export function 加载全球数据表(ctx: Context) {
    ctx.model.extend('malieglobaldata', {

        id: { type: 'string', length: 255 },

        // 全局数据
        全球劳动力市场: { type: 'unsigned', initial: 0 },

        // 全球主要数据方差

        // 全球主要数据总和
        历史生产记录: { type: 'json', initial: [] },
        近七天全球生产总值: { type: 'float', initial: 0 },
        近三天全球生产总值: { type: 'float', initial: 0 },
        今日全球生产总值: { type: 'float', initial: 0 },

         // 全球主要数据平均值
        全球平均工资: { type: 'float', initial: 0 },
        全球平均科技等级: { type: 'float', initial: 1 },

        // 全球主要数据中间值

    }, {
        primary: 'id'
    });
}
