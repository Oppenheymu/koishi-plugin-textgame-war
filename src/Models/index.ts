import { Context } from 'koishi';
import { Player , PlayerConfig , Service } from '../Types/index';



declare module 'koishi' {

    interface Tables {
        malieplayer: Player
        malieplayerconfig: PlayerConfig
        malieservice: Service
    }

}


import { 加载玩家配置表 } from './PlayerConfig';
import { 加载玩家表 } from './Player';
import { setupServiceModel } from './Service';

export function 数据库服务(ctx: Context) {

    加载玩家配置表(ctx);
    加载玩家表(ctx)

    setupServiceModel(ctx);

}