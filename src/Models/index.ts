import { Context } from 'koishi';
import { Player } from '../Types/Player';

declare module 'koishi' {
  interface Tables {
    malieplayer: Player
  }
}



import { setupPlayerModel } from './Player';

export function Database(ctx: Context) {

  // 按依赖顺序初始化模型
  setupPlayerModel(ctx)

}