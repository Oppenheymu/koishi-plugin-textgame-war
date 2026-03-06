import { Context } from 'koishi';
import { Player , PlayerConfig , Service , GlobalData } from '../Types/index';



declare module 'koishi' {

    interface Tables {
        malieplayer: Player
        malieplayerconfig: PlayerConfig
        malieservice: Service
        malieglobaldata: GlobalData
    }
}


import { 加载玩家配置表 } from './PlayerConfig';
import { 加载玩家表 } from './Player';
import { 加载服务表 } from './Service';
import { 加载全球数据表 } from './GlobalData';

export function 数据库服务(ctx: Context) {

    加载全球数据表(ctx);
    加载玩家配置表(ctx);
    加载玩家表(ctx)

    加载服务表(ctx);

}
