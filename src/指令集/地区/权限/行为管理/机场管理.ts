import type { Context, Session } from "koishi";
import { 地区机场权限设置检查 } from "#/logic";
import { 更新地区资料 } from "#/utils";

type 机场权限模式 = "允许全部" | "仅联军";

function 解析机场权限模式(输入值?: string): 机场权限模式 | null {
    const 标准输入 = 输入值?.trim();
    if (!标准输入) return null;

    if (
        ["允许", "开放", "允许全部", "全部", "是", "开", "on"].includes(
            标准输入,
        )
    ) {
        return "允许全部";
    }

    if (["限制", "仅联军", "联军", "否", "关", "off"].includes(标准输入)) {
        return "仅联军";
    }

    return null;
}

async function 执行机场权限设置(
    ctx: Context,
    session: Session | undefined,
    地区编号参数: string | undefined,
    权限模式: 机场权限模式,
): Promise<string> {
    const { username, 地区编号, 展示地区名称, 地区资料 } =
        await 地区机场权限设置检查(ctx, session, 地区编号参数);

    const 允许非联军成员使用机场 = 权限模式 === "允许全部";
    const 原状态 = 地区资料.允许非联军成员使用机场 ?? true;

    if (原状态 === 允许非联军成员使用机场) {
        return `${展示地区名称}（${地区编号}）当前已是该机场权限状态`;
    }

    await 更新地区资料(ctx, 地区编号, {
        允许非联军成员使用机场,
    });

    return `
====[征战文游]====
${username} 同志！
地区机场权限已更新
■ 地区：${展示地区名称}（${地区编号}）
■ 新权限：${允许非联军成员使用机场 ? "允许非联军成员使用机场" : "仅联军成员可使用机场"}
`.trim();
}

export function 设置机场权限(ctx: Context) {
    ctx.command("设置机场权限 <权限模式:string> [地区编号:string]")
        .alias("城市机场权限")
        .alias("地区机场权限")
        .alias("地区机场权限")
        .alias("机场权限")
        .action(async ({ session }, 权限模式参数, 地区编号参数) => {
            try {
                const 权限模式 = 解析机场权限模式(权限模式参数);
                if (!权限模式) {
                    return "参数无效，请使用：允许 / 限制（可选地区编号）";
                }

                return await 执行机场权限设置(
                    ctx,
                    session,
                    地区编号参数,
                    权限模式,
                );
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command("允许机场使用 [地区编号:string]")
        .alias("开启机场公用")
        .alias("机场公用")
        .action(async ({ session }, 地区编号参数) => {
            try {
                return await 执行机场权限设置(
                    ctx,
                    session,
                    地区编号参数,
                    "允许全部",
                );
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command("禁止机场使用 [地区编号:string]")
        .alias("开启机场私用")
        .alias("机场私用")
        .action(async ({ session }, 地区编号参数) => {
            try {
                return await 执行机场权限设置(
                    ctx,
                    session,
                    地区编号参数,
                    "仅联军",
                );
            } catch (error) {
                return (error as Error).message;
            }
        });
}
