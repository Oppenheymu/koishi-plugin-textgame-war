import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Context } from 'koishi';
import { h } from 'koishi';
import { GenerateMap } from '@/services';
import type { Region } from '@/types';
import { 玩家检查, 玩家联军检查 } from '@/utils';

const CACHE_DIR = path.resolve(__dirname, '../../cache');
const FULL_MAP_CACHE = path.join(CACHE_DIR, 'full.png');

export function ViewMap(ctx: Context) {
    ctx.command('查看地图', '查看完整的世界地图')
        .alias('查看世界地图', '世界地图')
        .action(async ({ session }) => {
            await 玩家检查(ctx, session);

            try {
                await session?.send('正在获取最新的世界地图，请稍候...');
                const buffer = await fs.readFile(FULL_MAP_CACHE);
                return h.image(buffer, 'image/png');
            } catch {
                return '抱歉，世界地图当前不可用。可能是尚未生成或服务器出现问题，请稍后重试。';
            }
        });

    ctx.command(
        '查看局部地图 [regionId:string]',
        '如果没有添加参数则查看以联军首都为中心的10格半径地图'
    )
        .alias('地区地图')
        .action(async ({ session }, regionId) => {
            const { uid } = await 玩家检查(ctx, session);

            let centerName: string;
            let centerGridX: number;
            let centerGridY: number;

            if (regionId) {
                const 目标地区 = (
                    await ctx.database.get('马列地区表', { 地区编号: regionId })
                )[0] as Region | undefined;
                if (
                    !目标地区 ||
                    目标地区.栅格X == null ||
                    目标地区.栅格Y == null
                ) {
                    return `地区编号 ${regionId} 的数据不完整。`;
                }
                centerName = `地区 ${regionId}`;
                centerGridX = 目标地区.栅格X;
                centerGridY = 目标地区.栅格Y;
            } else {
                const { 联军资料 } = await 玩家联军检查(ctx, session);
                const 首都编号 = 联军资料.联军首都;
                if (!首都编号) {
                    return '您的联军尚未指定首都，无法生成局部地图。请指定地区编号，或联系管理员设置首都。';
                }
                const 首都地区 = (
                    await ctx.database.get('马列地区表', { 地区编号: 首都编号 })
                )[0] as Region | undefined;
                if (
                    !首都地区 ||
                    首都地区.栅格X == null ||
                    首都地区.栅格Y == null
                ) {
                    return '错误：联军首都地区数据不完整，请联系管理员。';
                }
                centerName = '联军首都';
                centerGridX = 首都地区.栅格X;
                centerGridY = 首都地区.栅格Y;
            }

            await session?.send(
                `正在为您生成以${centerName}为中心的局部地图，请稍候...`
            );
            try {
                const buffer = await GenerateMap(ctx, {
                    centerGridX,
                    centerGridY,
                    radius: 10,
                });
                if (buffer) {
                    return h.image(buffer, 'image/png');
                }
                return '生成局部地图失败，请联系管理员检查后台日志。';
            } catch (error) {
                if (error instanceof Error && error.message) {
                    return error.message;
                }
                console.error(`为玩家 ${uid} 生成局部地图时出错:`, error);
                return '生成局部地图时遇到未知错误。';
            }
        });
}
