export interface PlayerWarData {
	id: number;
	uid: string;

	// 陆军
	私人军队: number;
	步兵装备: number;
	重炮: number;
	火箭炮: number;
	火箭炮弹药: number;

	// 空军
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

	// 地堡相关
	地下工厂投入: number;
	是否有地下工厂: boolean;
	地下机库投入: number;
	是否有地下机库: boolean;
	地下弹药库投入: number;
	是否有地下弹药库: boolean;

	// 地下机库相关
	地下飞机: number;
	地下隐形飞机: number;
	地下预警机: number;
	地下大型运输机: number;
	地下小型运输机: number;

	// 地下弹药库相关
	地下火箭炮炮弹: number;
	地下防空弹药: number;
}
