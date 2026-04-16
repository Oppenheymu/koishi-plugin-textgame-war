import type { Context } from 'koishi';

export function 加载地区状态表(ctx: Context) {
    ctx.model.extend(
        '马列地区状态机',
        {
            地区编号: {
                type: 'string',
            },

            地区归属国: {
                type: 'unsigned',
                nullable: true,
            },
            是否已分配: {
                type: 'boolean',
            },
        },
        {
            primary: '地区编号',
            unique: ['地区编号'],
        }
    );

    ctx.model.extend(
        '马列地区洗牌池',
        {
            id: {
                type: 'unsigned',
            },
            地区编号: {
                type: 'string',
            },
        },
        {
            primary: 'id',
            unique: ['id'],
        }
    );
}
