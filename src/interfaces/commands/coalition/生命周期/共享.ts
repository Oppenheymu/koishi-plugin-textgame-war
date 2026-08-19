type 联军邀请记录 = {
    联军编号: string;
    联军名称: string;
    目标用户ID: number;
    目标UID: string;
    目标用户名: string;
    邀请人用户名: string;
    过期时间戳: number;
};

export const 联军邀请缓存 = new Map<string, 联军邀请记录>();

export function 构造邀请键(联军编号: string, 目标uid: string) {
    return `${联军编号}:${目标uid}`;
}
