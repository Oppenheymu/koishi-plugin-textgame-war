import {
    Context
} from "koishi";



export function 加载联军权限表(ctx: Context) {
    ctx.model.extend(
        "马列联军权限表", {
            联军编号: {
                type: "string",
                length: 255
            },
            成员列表: {
                type: "unsigned",
                initial: 4
            },
            地区列表: {
                type: "unsigned",
                initial: 4
            },
            贡献排行: {
                type: "unsigned",
                initial: 4
            },
            邀请加入联军: {
                type: "unsigned",
                initial: 3
            },
            设置联军权限: {
                type: "unsigned",
                initial: 4
            },
            移出联军: {
                type: "unsigned",
                initial: 3
            },
            我的联军权限: {
                type: "unsigned",
                initial: 1
            },
            查看地区军事: {
                type: "unsigned",
                initial: 3
            },
            查看地区铁路: {
                type: "unsigned",
                initial: 3
            },
            查看地区生物实验室: {
                type: "unsigned",
                initial: 3
            },
            查看地区核反应堆: {
                type: "unsigned",
                initial: 4
            },
            查看地区离心机组: {
                type: "unsigned",
                initial: 4
            },
            设置地区驻扎权限: {
                type: "unsigned",
                initial: 3
            },
        }, {
            primary: "联军编号",
            unique: ["联军编号"],
        }
    );
}
