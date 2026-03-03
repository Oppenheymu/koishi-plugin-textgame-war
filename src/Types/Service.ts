//各种全局状态机储存

export interface Service {
  id: string;  // 固定值 'service'，保证只有一条全局配置记录
  上次重置签到日期: string;
}