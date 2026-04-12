import {
    Context
} from "koishi";

export function 加载联军表(ctx: Context) {
    ctx.model.extend(
        "马列联军表", {
            id: {
                type: "unsigned",
                length: 255
            },
            联军编号: {
                type: "string",
                length: 255
            },

            联军元首: {
                type: "string",
                length: 255
            },
            联军总理: {
                type: "string",
                length: 255
            },

            联军四级权限成员列表: {
                type: "json",
                initial: []
            },
            联军三级权限成员列表: {
                type: "json",
                initial: []
            },
            联军二级权限成员列表: {
                type: "json",
                initial: []
            },
                        联军一级权限成员列表: {
                type: "json",
                initial: []
            },

            联军政治体制: {
                type: "string",
                length: 32
            },

            联军税率: {
                type: "float",
                initial: 0
            },
            当天内资本增量: {
                type: "float",
                initial: 0
            },
            三天内资本增量: {
                type: "float",
                initial: 0
            },
            七天内资本增量: {
                type: "float",
                initial: 0
            },
            资本增量历史记录: {
                type: "json",
                initial: []
            },

            联军成员数量: {
                type: "unsigned",
                initial: 0
            },
            联军成员列表: {
                type: "json"
            },

            联军首都: {
                type: "string",
                length: 255,
                initial: ""
            },
            联军地区列表: {
                type: "json",
                initial: []
            },

            联军军队: {
                type: "unsigned",
                initial: 0
            },
            联军生活资料: {
                type: "unsigned",
                initial: 0
            },
            生活资料分配记录: {
                type: "json",
                initial: []
            },

            联军宣称人口: {
                type: "unsigned",
                initial: 0
            },
            联军宣称兵力: {
                type: "unsigned",
                initial: 0
            },

            联军名称: {
                type: "string",
                length: 255,
                initial: ""
            },
            名称是否审核: {
                type: "boolean",
                initial: false
            },

            建立日期: {
                type: "string",
                length: 255,
                initial: ""
            },
            上次改名日期: {
                type: "string",
                length: 255,
                nullable: true
            },
        }, {
            primary: "id",
            unique: ["联军编号"],
            autoInc: true,
        }
    );
}
