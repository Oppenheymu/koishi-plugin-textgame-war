
import { Context } from 'koishi'
import { 地区解析, 当前地区解析 } from "../../../utils";



const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 查看地区军事(ctx: Context) {
    ctx.command("查看地区军事 [地区编号:string]").alias("查看城市军事").alias('军事基地').alias('地区军事').alias('城市军事')
        .action( async ( { session }, 地区编号参数 ) => {
            try {

                const 规范地区编号 = 地区编号参数?.trim();
                const { 地区编号, 地区资料, 展示地区名称 } = 规范地区编号
                    ? await 地区解析(ctx, 规范地区编号)
                    : await 当前地区解析(ctx, session);

                return `
【城市信息】
${展示地区名称}
■ 地区编号：${地区编号}
■ 司令: ${地区资料.地区司令}
□ 驻军：${地区资料.地区驻军}
□ 要塞: ${地区资料.地区堡垒}
□ 历史战争：
`.trim()
            } catch (error) {
                return (error as Error).message;
            }
        });
}
