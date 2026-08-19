export interface 服务记录初始化结果 {
    created: boolean;
    今天: string;
}

export interface 每日签到重置结果 {
    是否执行: boolean;
    今天: string;
    重置玩家数量: number;
    原因?: string;
}

export interface 每时生产重置结果 {
    重置玩家数量: number;
}
