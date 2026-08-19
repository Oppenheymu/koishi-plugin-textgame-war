// 军队操作者（军队工作流共用操作者身份，详见 军事系统.prompt.md 第 7 章）
import type { Player, PlayerWarData } from "#ctx/player";

type 玩家完整资料 = Player & PlayerWarData;

export interface 军队操作者 {
    id: number;
    uid: string;
    username: string;
    用户资料: 玩家完整资料;
    权限等级: number;
}
