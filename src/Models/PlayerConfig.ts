import { Context } from 'koishi';



export function 加载玩家配置表(ctx: Context) {
    ctx.model.extend('malieplayerconfig', {

        id: { type: 'unsigned' },
        // 混淆后的ID
        uid: { type: 'string', length: 255 },

        // 第三方平台ID
        onebot: { type: 'string', length: 255, nullable: true },
        discord: { type: 'string', length: 255, nullable: true },
        telegram: { type: 'string', length: 255, nullable: true },

        // 昵称
        username: { type: 'string', length: 255 },

    }, {
        // 表配置
        primary: 'id',
        unique: ['uid'],
        autoInc: true,
    });

}
