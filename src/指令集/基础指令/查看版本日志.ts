import { Context } from 'koishi'



export function 查看版本日志(ctx: Context) {
    ctx.command('查看征战版本日志')
        .action(async ( { session } ) => {
            return `
[征战文游]
当前版本：1.0.0
版本日志：
 - 城市间暂时没有平面关系，后续会增加地图系统
`.trim();
        });
}
