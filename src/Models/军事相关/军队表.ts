import type { Context } from "koishi";
import { 军队命令, 军队状态 } from "#/types";

/**
 * 军队表：id 即全局编号（自增纯数字，指令指定用）
 * 27 种装备数量列镜像 玩家战争表 风格逐列声明
 * 属性面板不落库，由 logic/军事相关/属性聚合.ts 现算
 */
export function 加载军队表(ctx: Context) {
    ctx.model.extend(
        "马列军队表",
        {
            id: {
                type: "unsigned",
            },
            番号: {
                type: "unsigned",
            },
            名称: {
                type: "string",
                length: 255,
            },
            名称是否审核: {
                type: "boolean",
                initial: false,
            },
            所属联军编号: {
                type: "string",
                length: 255,
            },
            指挥官UID: {
                type: "string",
                length: 255,
                nullable: true,
                initial: null,
            },

            士兵数量: {
                type: "unsigned",
                initial: 0,
            },
            经验值: {
                type: "double",
                initial: 0,
            },

            // 状态机
            状态: {
                type: "string",
                length: 32,
                initial: 军队状态.驻扎,
            },
            所在地区编号: {
                type: "string",
                length: 255,
            },
            目标地区编号: {
                type: "string",
                length: 255,
                nullable: true,
                initial: null,
            },
            预计到达时间: {
                type: "string",
                length: 255,
                nullable: true,
                initial: null,
            },

            // 战斗状态（0~1 比例，上限由面板聚合得出）
            当前组织度比例: {
                type: "double",
                initial: 1,
            },
            当前HP比例: {
                type: "double",
                initial: 1,
            },

            // 命令优先级
            当前命令: {
                type: "string",
                length: 32,
                initial: 军队命令.正常,
            },
            命令下达者军衔: {
                type: "unsigned",
                initial: 0,
            },

            // 参战指针
            当前战斗编号: {
                type: "unsigned",
                nullable: true,
                initial: null,
            },
            战斗阵营: {
                type: "string",
                length: 32,
                nullable: true,
                initial: null,
            },

            // 陆军
            步兵装备: { type: "unsigned", initial: 0 },
            卡车: { type: "unsigned", initial: 0 },
            两栖坦克: { type: "unsigned", initial: 0 },
            轻型坦克: { type: "unsigned", initial: 0 },
            中型坦克: { type: "unsigned", initial: 0 },
            重型坦克: { type: "unsigned", initial: 0 },
            现代坦克: { type: "unsigned", initial: 0 },
            装甲运兵车: { type: "unsigned", initial: 0 },
            两栖装甲运兵车: { type: "unsigned", initial: 0 },
            坦克歼击车: { type: "unsigned", initial: 0 },
            自行防空车: { type: "unsigned", initial: 0 },
            野战炮: { type: "unsigned", initial: 0 },
            火炮: { type: "unsigned", initial: 0 },
            火箭炮: { type: "unsigned", initial: 0 },
            列车炮: { type: "unsigned", initial: 0 },

            // 空军（第一阶段预留，不参与结算）
            侦察机: { type: "unsigned", initial: 0 },
            战斗机: { type: "unsigned", initial: 0 },
            预警机: { type: "unsigned", initial: 0 },
            战术轰炸机: { type: "unsigned", initial: 0 },
            战略轰炸机: { type: "unsigned", initial: 0 },
            隐形轰炸机: { type: "unsigned", initial: 0 },
            大型运输机: { type: "unsigned", initial: 0 },
            小型运输机: { type: "unsigned", initial: 0 },

            // 弹药（第一阶段预留，不参与结算）
            火箭弹: { type: "unsigned", initial: 0 },
            防空弹药: { type: "unsigned", initial: 0 },
            轻型航弹: { type: "unsigned", initial: 0 },
            重型航弹: { type: "unsigned", initial: 0 },

            建立日期: {
                type: "string",
                length: 255,
                initial: "",
            },
        },
        {
            primary: "id",
            autoInc: true,
        },
    );
}
