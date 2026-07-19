import type { 发送失败记录, 发送记录 } from "../utils";

export type 信号塔平台 = "onebot" | "discord" | "telegram";

export interface 信号塔发送参数 {
    联军编号: string;
    通报内容: string;
    通报标题?: string;
}

export interface 信号塔发送结果 {
    联军编号: string;
    展示联军名称: string;
    首都地区编号: string;
    展示地区名称: string;
    已发送: 发送记录[];
    发送失败: 发送失败记录[];
}
