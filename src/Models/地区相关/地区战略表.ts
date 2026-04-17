import type { Context } from 'koishi';

export function 加载地区战略表(ctx: Context) {
    ctx.model.extend(
        '马列地区战略表',
        {
            地区编号: {
                type: 'string',
                length: 255,
            },

            地区司令: {
                type: 'string',
                length: 255,
                initial: '',
            },

            地区仓库: {
                type: 'json',
            },

            铁路: {
                type: 'json',
            },
            是否有铁路: {
                type: 'boolean',
                initial: false,
            },

            地区驻军: {
                type: 'unsigned',
                initial: 0,
            },
            地区堡垒: {
                type: 'unsigned',
                initial: 0,
            },

            生物实验室: {
                type: 'json',
            },

            高速离心级联: {
                type: 'json',
            },
            核反应堆: {
                type: 'json',
            },

            已部署列车炮: {
                type: 'unsigned',
                initial: 0,
            },
            空闲的列车炮: {
                type: 'unsigned',
                initial: 0,
            },

            历史战争: {
                type: 'json',
            },
        },
        {
            primary: '地区编号',
            unique: ['地区编号'],
        }
    );
}
