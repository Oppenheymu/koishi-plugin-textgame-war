import { Context } from 'koishi';
import { Player , PlayerConfig , Service , GlobalData , RegionTerra , Region } from '../Types/index';



declare module 'koishi' {

    interface Tables {
        malieplayer: Player
        malieplayerconfig: PlayerConfig
        malieservice: Service
        malieglobaldata: GlobalData
        malieregionterra: RegionTerra
        malieregion: Region
    }
}


import { 加载玩家配置表 } from './PlayerConfig';
import { 加载玩家表 } from './Player';
import { 加载服务表 } from './Service';
import { 加载全球数据表 } from './GlobalData';
import { 加载地区地形表 } from './RegionTerra';
import { 加载地区表 } from './Region';

export function 数据库服务(ctx: Context) {

    加载全球数据表(ctx);
    加载玩家配置表(ctx);
    加载玩家表(ctx)

    加载服务表(ctx);

    加载地区表(ctx);
    加载地区地形表(ctx);

}
