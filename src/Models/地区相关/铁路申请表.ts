import type { Context } from 'koishi';

export function 加载铁路修建申请表(ctx: Context) {
    ctx.model.extend(
        '马列铁路修建申请表',
        {
            id: {
                type: 'string',
                length: 255,
            },
            状态: {
                type: 'string',
                length: 32,
                initial: 'pending',
            },

            申请人ID: {
                type: 'unsigned',
            },
            申请人UID: {
                type: 'string',
                length: 255,
            },
            申请人名称: {
                type: 'string',
                length: 255,
            },

            发起联军编号: {
                type: 'string',
                length: 255,
            },
            发起联军名称: {
                type: 'string',
                length: 255,
            },
            发起地区编号: {
                type: 'string',
                length: 255,
            },

            目标地区编号: {
                type: 'string',
                length: 255,
            },
            目标联军编号: {
                type: 'string',
                length: 255,
            },
            目标联军名称: {
                type: 'string',
                length: 255,
            },

            铁路类型: {
                type: 'string',
                length: 255,
            },
            铁路类型名称: {
                type: 'string',
                length: 255,
            },

            最终需求生产力: {
                type: 'unsigned',
                initial: 0,
            },
            提供运力: {
                type: 'unsigned',
                initial: 0,
            },
            已投入生产力: {
                type: 'unsigned',
                initial: 0,
            },

            创建时间: {
                type: 'string',
                length: 255,
            },
            更新时间: {
                type: 'string',
                length: 255,
            },
            过期时间: {
                type: 'string',
                length: 255,
            },

            审批人UID: {
                type: 'string',
                length: 255,
                initial: '',
            },
            审批备注: {
                type: 'string',
                length: 255,
                initial: '',
            },
        },
        {
            primary: 'id',
            unique: ['id'],
        }
    );
}
