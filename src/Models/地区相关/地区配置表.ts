import type { Context } from 'koishi';

export function 加载地区配置表(ctx: Context) {
    ctx.model.extend(
        '马列地区配置表',
        {
            地区编号: {
                type: 'string',
            },

            // 第三方平台ID
            onebot: {
                type: 'string',
                length: 255,
                nullable: true,
            },
            discord: {
                type: 'string',
                length: 255,
                nullable: true,
            },
            telegram: {
                type: 'string',
                length: 255,
                nullable: true,
            },

            地区名称: {
                type: 'string',
                length: 255,
                initial: '',
            },
            名称是否审核: {
                type: 'boolean',
                initial: false,
            },
            上次改名日期: {
                type: 'string',
                length: 255,
                nullable: true,
            },
        },
        {
            // 表配置
            primary: '地区编号',
            unique: ['地区编号'],
        }
    );
}
