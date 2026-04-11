import {
    Context
} from "koishi";
import {
    联军政体
} from "../../../types";
import {
    获取成员联军贡献,
    获取排除成员后前N贡献总和,
    获取排除成员后平均贡献,
    获取政体默认权限配置,
    极权制降权到一级,
    按政体动态分配权限,
    玩家联军检查,
    设置联军权限配置,
} from "../../../utils";

function 是否有效政体(输入: string): 输入 is 联军政体 {
    return Object.values(联军政体).includes(输入 as 联军政体);
}

const 格式化 = (n: number) =>
    n.toLocaleString("zh-CN", {
        maximumFractionDigits: 2
    });

export function 选择政体(ctx: Context) {
    ctx.command("选择政体 <政体:string>")
        .alias("设置政体")
        .action(async ({
            session
        }, 政体) => {
            try {
                const {
                    uid,
                    username,
                    联军资料,
                    联军编号
                } =
                await 玩家联军检查(ctx, session, {
                    最低权限等级: 4,
                    是否必须在成员列表: true,
                });

                const 目标政体 = 政体?.trim();
                if (!目标政体 || !是否有效政体(目标政体)) {
                    return "无效政体，请使用：民主制 / 威权制 / 极权制";
                }

                const 当前政体 = 联军资料.联军政治体制;
                if (当前政体 === 目标政体) {
                    return `当前已是${目标政体}`;
                }

                const 我的贡献 = 获取成员联军贡献(联军资料, uid);

                if (
                    当前政体 === 联军政体.民主制 &&
                    目标政体 === 联军政体.极权制
                ) {
                    const 前六总贡献 = 获取排除成员后前N贡献总和(
                        联军资料,
                        uid,
                        6
                    );
                    if (我的贡献 <= 前六总贡献) {
                        return `从民主制变更为极权制失败：你的贡献（${格式化(
                            我的贡献
                        )}）必须大于前六成员总贡献（${格式化(前六总贡献)}）`;
                    }
                }

                if (
                    当前政体 === 联军政体.民主制 &&
                    目标政体 === 联军政体.威权制
                ) {
                    const 平均贡献 = 获取排除成员后平均贡献(联军资料, uid);
                    if (我的贡献 <= 平均贡献) {
                        return `从民主制变更为威权制失败：你的贡献（${格式化(
                            我的贡献
                        )}）必须大于其他成员平均贡献（${格式化(平均贡献)}）`;
                    }
                }

                const 权限列表更新 =
                    目标政体 === 联军政体.极权制 ?
                    极权制降权到一级(联军资料, uid) :
                    按政体动态分配权限({
                        ...联军资料,
                        联军政治体制: 目标政体,
                    });

                await Promise.all([
                    ctx.database.set(
                        "马列联军表", {
                            联军编号
                        }, {
                            联军政治体制: 目标政体,
                            ...权限列表更新,
                        }
                    ),
                    设置联军权限配置(
                        ctx,
                        联军编号,
                        获取政体默认权限配置(目标政体)
                    ),
                ]);

                return `
====[征战文游]====
${username} 同志！
联军政体已切换为：${目标政体}
■ 联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}