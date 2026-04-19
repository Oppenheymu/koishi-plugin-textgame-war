import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Context } from 'koishi';
import { h } from 'koishi';
import type { Region } from '@/types';
import { 玩家检查, 玩家联军检查 } from '@/utils';
import { GenerateMap } from './生成地图';

const FULL_MAP_SAVE_PATH = path.resolve(__dirname, '../MapData/Map.png');

const fullMapViewCooldowns = new Map<string, number>();
const radiusMapViewCooldowns = new Map<string, number>();

export function ViewMap(ctx: Context) {
    ctx.command('查看地图', '查看完整的世界地图 (5分钟冷却)')
        .alias('查看世界地图', '世界地图')
        .action(async ({ session }) => {
            const { uid } = await 玩家检查(ctx, session);

            const now = Date.now();
            const lastView = fullMapViewCooldowns.get(uid) || 0;
            const cooldown = 5 * 60 * 1000;

            if (now - lastView < cooldown) {
                const remaining = Math.ceil(
                    (cooldown - (now - lastView)) / 1000
                );
                return `操作太频繁了，请在 ${remaining} 秒后重试。`;
            }

            try {
                await session?.send('正在获取最新的世界地图，请稍候...');
                const buffer = await fs.readFile(FULL_MAP_SAVE_PATH);
                fullMapViewCooldowns.set(uid, now);
                return h.image(buffer, 'image/png');
            } catch {
                return '抱歉，世界地图当前不可用。可能是尚未生成或服务器出现问题，请稍后重试。';
            }
        });

    ctx.command(
        '查看局部地图',
        '查看以您的联军首都为中心的10格半径地图 (60分钟冷却)'
    ).action(async ({ session }) => {
        const { uid } = await 玩家检查(ctx, session);
        const { 联军资料 } = await 玩家联军检查(ctx, session);

        const radius = 10;

        const now = Date.now();
        const lastView = radiusMapViewCooldowns.get(uid) || 0;
        const cooldown = 60 * 60 * 1000;

        if (now - lastView < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastView)) / 1000);
            return `该功能消耗较大，请在 ${remaining} 秒后重试。`;
        }

        await session?.send(
            '正在为您生成以联军首都为中心的局部地图，请稍候...'
        );
        try {
            const 首都编号 = 联军资料.联军首都;
            if (!首都编号) {
                return '您的联军尚未指定首都，无法生成局部地图。';
            }

            const 首都地区 = (
                await ctx.database.get('马列地区表', { 地区编号: 首都编号 })
            )[0] as Region | undefined;
            if (!首都地区 || 首都地区.栅格X == null || 首都地区.栅格Y == null) {
                return '错误：联军首都地区数据不完整，请联系管理员。';
            }

            const buffer = await GenerateMap(ctx, {
                centerGridX: 首都地区.栅格X,
                centerGridY: 首都地区.栅格Y,
                radius,
            });

            if (buffer) {
                radiusMapViewCooldowns.set(uid, now);
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

    ctx.command(
        '查看指定地区地图 <regionId:string>',
        '查看以指定地区为中心的10格半径地图 (60分钟冷却)'
    )
        .alias('地区地图')
        .action(async ({ session }, regionId) => {
            const { uid } = await 玩家检查(ctx, session);

            if (!regionId) return '请输入地区编号。';

            const radius = 10;

            const now = Date.now();
            const lastView = radiusMapViewCooldowns.get(uid) || 0;
            const cooldown = 60 * 60 * 1000;

            if (now - lastView < cooldown) {
                const remaining = Math.ceil(
                    (cooldown - (now - lastView)) / 1000
                );
                return `该功能消耗较大，请在 ${remaining} 秒后重试。`;
            }

            await session?.send('正在生成局部地图，请稍候...');
            try {
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

                const buffer = await GenerateMap(ctx, {
                    centerGridX: 目标地区.栅格X,
                    centerGridY: 目标地区.栅格Y,
                    radius,
                });
                if (buffer) {
                    radiusMapViewCooldowns.set(uid, now);
                    return h.image(buffer, 'image/png');
                }
                return '生成局部地图失败，请联系管理员检查后台日志。';
            } catch (error) {
                console.error(`为玩家 ${uid} 生成局部地图时出错:`, error);
                return '生成局部地图时遇到未知错误。';
            }
        });
}
