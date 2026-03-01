import { Context } from 'koishi';
import { Player , Service } from '../Types/index';



declare module 'koishi' {
  interface Tables {
    malieplayer: Player
    malieservice: Service
  }
}



import { setupPlayerModel } from './Player';
import { setupServiceModel } from './Service';

export function 数据库服务(ctx: Context) {

  // 按依赖顺序初始化模型
  setupServiceModel(ctx);
  setupPlayerModel(ctx)

}