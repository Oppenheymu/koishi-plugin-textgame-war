import type { 军衔, 军衔来源, 军队命令, 军队状态, 战斗状态, 战斗阵营 } from "#ctx/military/domain/types/枚举";

/**
 * 军衔表记录（马列联军军衔表）
 * 唯一约束：[联军编号, 玩家UID]（联军内一人一衔）
 */
export interface CoalitionRank {
    id: number;
    联军编号: string;
    玩家UID: string;
    军衔: 军衔;
    来源: 军衔来源;
    授予者UID: string; // 政体自动时为元首UID
    授予时间: string;
}

/**
 * 军队表记录（马列军队表）
 * id 即全局编号（自增纯数字，指令指定用）；番号为联军内递增（显示用）
 */
export interface Army {
    id: number;
    番号: number;
    名称: string; // 完整名称 = 联军名 + 自定义部分
    名称是否审核: boolean;
    所属联军编号: string;
    指挥官UID: string | null; // null = 无主军队（原地驻扎，等待重新任命）

    士兵数量: number;
    经验值: number;

    // 状态机
    状态: 军队状态;
    所在地区编号: string;
    目标地区编号: string | null;
    预计到达时间: string | null; // ISO 时间戳，后台轮询判定到达

    // 战斗状态（0~1 比例，上限由面板聚合得出）
    当前组织度比例: number;
    当前HP比例: number;

    // 命令优先级：新命令需 下达者军衔 ≥ 命令下达者军衔 才能覆盖
    当前命令: 军队命令;
    命令下达者军衔: number;

    // 参战指针（配合 战斗阵营 反查参战双方，不落参与表）
    当前战斗编号: number | null;
    战斗阵营: 战斗阵营 | null;

    // 27 种装备数量列（镜像 玩家战争表 风格逐列声明）
    // 陆军
    步兵装备: number;
    卡车: number;
    两栖坦克: number;
    轻型坦克: number;
    中型坦克: number;
    重型坦克: number;
    现代坦克: number;
    装甲运兵车: number;
    两栖装甲运兵车: number;
    坦克歼击车: number;
    自行防空车: number;
    野战炮: number;
    火炮: number;
    火箭炮: number;
    列车炮: number;
    // 空军（第一阶段预留，不参与结算）
    侦察机: number;
    战斗机: number;
    预警机: number;
    战术轰炸机: number;
    战略轰炸机: number;
    隐形轰炸机: number;
    大型运输机: number;
    小型运输机: number;
    // 弹药（第一阶段预留，不参与结算）
    火箭弹: number;
    防空弹药: number;
    轻型航弹: number;
    重型航弹: number;

    建立日期: string;
}

/**
 * 战斗表记录（马列战斗表）
 * 参与关系由 Army.当前战斗编号 + Army.战斗阵营 反查
 */
export interface Battle {
    id: number;
    地区编号: string;
    进攻方联军编号: string;
    防守方联军编号: string;
    回合数: number;
    状态: 战斗状态;
    开始时间: string;
    结束时间: string | null;
    结果: string | null; // "进攻方胜" / "防守方胜" / "进攻方撤退" 等
}
