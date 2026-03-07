
export interface Player {

    id: number;
    uid: string;

    //状态机
    驻扎地区: string | null;
    战争保护期: number | null;
    今日是否签到: boolean;
    小时是否生产: boolean;

    //状态
    稳定度: number;
    生产次数: number;
    工人工资: number;
    工人招募限额: number;

    //全部资料
    生活资料: number;
    生产技术: number;
    厂房: number;
    工人: number;
    地下工人: number;
    休假工人: number;

    //科技相关
    科技等级: number;
    科技蓝图: number;
    科技池投入: number;
    科技池容量: number;

    //资源
    石油: number;
    铝土矿: number;
    金属铝: number;
    铁矿石: number;
    钢铁: number;

    //陆军
    私人军队: number;
    重炮: number;
    火箭炮: number;
    火箭炮弹药: number;

    //空军
    防空弹药: number;
    侦察机: number;
    轰炸机: number;
    隐形轰炸机: number;
    大型运输机: number;
    小型运输机: number;
    预警机: number;
    巡航中的预警机: number;
    战斗机: number;
    巡航中的战斗机: number;

    //地下机库相关
    地下飞机: number;
    地下隐形飞机: number;
    地下预警机: number;
    地下大型运输机: number;
    地下小型运输机: number;

    //地下弹药库相关
    地下火箭炮炮弹: number;
    地下防空弹药: number;

}
