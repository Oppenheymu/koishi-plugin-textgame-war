import type { Context, Session } from 'koishi';

import { 获取运行时配置 } from '@/config';
import {
    世界银行地区编号,
    创建跨联军铁路申请,
    执行铁路修建,
    查询待审核铁路申请,
    计算铁路建造成本,
    请求联军审批,
} from '@/logic';
import type { TerrainType } from '@/types';
import { 地区解析, 地区驻扎权限设置检查, 当前地区解析, 玩家检查 } from '@/utils';
import {
    格式化,
    生成审核推送文本,
    生成铁路类型提示文本,
    组装铁路修建结果文本,
    解析铁路类型输入,
} from './共享';

async function 获取目标地区基础信息(
    ctx: Context,
    session: Session | undefined,
    目标地区编号: string
): Promise<
    | {
          地形?: TerrainType;
          配置?: {
              地区编号: string;
              控制国家: string;
              onebot: string;
              discord: string;
              telegram: string;
          };
      }
    | never
> {
    if (目标地区编号 === 世界银行地区编号) {
        return {};
    }

    const 目标地区结果 = await 地区解析(ctx, 目标地区编号, session);

    return {
        地形: 目标地区结果.地区资料.地区地形,
        配置: {
            地区编号: 目标地区结果.地区编号,
            控制国家: 目标地区结果.地区资料.控制国家?.trim() || '',
            onebot: 目标地区结果.地区配置资料.onebot,
            discord: 目标地区结果.地区配置资料.discord,
            telegram: 目标地区结果.地区配置资料.telegram,
        },
    };
}

async function 执行修建主流程(
    ctx: Context,
    session: Session | undefined,
    目标地区参数: string | undefined
): Promise<string> {
    const 目标地区编号 = 目标地区参数?.trim();
    if (!目标地区编号) {
        return '请提供目标地区编号，例如：修建铁路 12345';
    }

    const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);
    const 来源地区结果 = await 当前地区解析(ctx, session);

    await 地区驻扎权限设置检查(ctx, session, 来源地区结果.地区编号);

    const 发起联军编号 = 来源地区结果.地区资料.控制国家?.trim();
    if (!发起联军编号) {
        return '当前地区暂无控制联军，无法发起铁路修建';
    }

    const [发起联军] = await ctx.database.get('马列联军表', {
        联军编号: 发起联军编号,
    });
    if (!发起联军) {
        return `数据异常：未找到发起联军 ${发起联军编号}`;
    }

    await session?.send(生成铁路类型提示文本());
    const 类型输入 = await session?.prompt(120000);
    const 目标类型ID = 解析铁路类型输入(类型输入);

    if (!目标类型ID) {
        return '铁路类型输入无效，已取消本次修建';
    }

    const 目标地区信息 = await 获取目标地区基础信息(ctx, session, 目标地区编号);
    const 建造成本 = 目标地区信息.地形
        ? 计算铁路建造成本({
              铁路类型输入: 目标类型ID,
              地形: 目标地区信息.地形,
          })
        : 计算铁路建造成本({
              铁路类型输入: 目标类型ID,
          });

    await session?.send('确定要修建该铁路吗？拆除是有成本的（Y/N）');
    const 确认输入 = (await session?.prompt(120000))?.trim().toUpperCase();
    if (!确认输入 || !['Y', 'YES', '是', '确认'].includes(确认输入)) {
        return '已取消铁路修建';
    }

    if (目标地区编号 === 世界银行地区编号) {
        const 结果 = await 执行铁路修建(ctx, {
            玩家ID: id,
            用户资料,
            发起地区编号: 来源地区结果.地区编号,
            目标地区编号,
            铁路类型: 建造成本.类型ID,
            最终需求生产力: 建造成本.最终需求生产力,
            提供运力: 建造成本.提供运力,
        });

        return 组装铁路修建结果文本({
            标题: '【铁路修建】',
            玩家名称: username,
            铁路类型: 建造成本.类型ID,
            铁路类型名称: 建造成本.类型名称,
            实际投入生产力: 结果.实际投入生产力,
            当前进度: 结果.当前进度,
            是否完工: 结果.是否完工,
            附加文案: `${username} 同志，已向世界银行方向发起修建。`,
        });
    }

    if (!目标地区信息.配置) {
        return '目标地区解析失败，请重试';
    }

    const 目标联军编号 = 目标地区信息.配置.控制国家;

    if (!目标联军编号 || 目标联军编号 === 发起联军编号) {
        const 结果 = await 执行铁路修建(ctx, {
            玩家ID: id,
            用户资料,
            发起地区编号: 来源地区结果.地区编号,
            目标地区编号: 目标地区信息.配置.地区编号,
            铁路类型: 建造成本.类型ID,
            最终需求生产力: 建造成本.最终需求生产力,
            提供运力: 建造成本.提供运力,
        });

        return 组装铁路修建结果文本({
            标题: '【铁路修建】',
            玩家名称: username,
            铁路类型: 建造成本.类型ID,
            铁路类型名称: 建造成本.类型名称,
            实际投入生产力: 结果.实际投入生产力,
            当前进度: 结果.当前进度,
            是否完工: 结果.是否完工,
        });
    }

    const [目标联军] = await ctx.database.get('马列联军表', {
        联军编号: 目标联军编号,
    });

    if (!目标联军) {
        return `目标地区控制联军不存在：${目标联军编号}`;
    }

    const 已有待审核 = await 查询待审核铁路申请(
        ctx,
        来源地区结果.地区编号,
        目标地区信息.配置.地区编号
    );

    if (已有待审核) {
        return `当前线路已有待审核申请：${已有待审核.id}`;
    }

    const 审批过期小时 = 获取运行时配置().土木工程.跨联军铁路审批过期小时;

    const 申请记录 = await 创建跨联军铁路申请(ctx, {
        申请人ID: id,
        申请人UID: uid,
        申请人名称: username,
        发起联军编号,
        发起联军名称: 发起联军.联军名称,
        发起地区编号: 来源地区结果.地区编号,
        目标联军编号,
        目标联军名称: 目标联军.联军名称,
        目标地区编号: 目标地区信息.配置.地区编号,
        铁路类型: 建造成本.类型ID,
        铁路类型名称: 建造成本.类型名称,
        最终需求生产力: 建造成本.最终需求生产力,
        提供运力: 建造成本.提供运力,
        审批过期小时,
    });

    const 推送文本 = 生成审核推送文本({
        申请ID: 申请记录.id,
        发起联军名称: 发起联军.联军名称,
        申请人名称: username,
        铁路类型: 建造成本.类型ID,
        铁路类型名称: 建造成本.类型名称,
        最终需求生产力: 建造成本.最终需求生产力,
        提供运力: 建造成本.提供运力,
    });

    const 推送结果 = await 请求联军审批(ctx, {
        文本内容: 推送文本,
        目标地区配置: {
            onebot: 目标地区信息.配置.onebot,
            discord: 目标地区信息.配置.discord,
            telegram: 目标地区信息.配置.telegram,
        },
    });

    return [
        '【铁路修建】',
        `检测到跨联军铁路，已提交申请：${申请记录.id}`,
        `目标联军：${目标联军.联军名称}（${目标联军编号}）`,
        `需求生产力：${格式化(建造成本.最终需求生产力)}`,
        `提供的运力：${格式化(建造成本.提供运力)}`,
        `推送成功：${推送结果.已发送.length}`,
    ].join('\n');
}

export function 修建铁路(ctx: Context) {
    ctx.command('修建铁路 <目标地区:string>')
    .alias("建造铁路")
    .action(async ({ session }, 目标地区参数) => {
        try {
            return await 执行修建主流程(ctx, session, 目标地区参数);
        } catch (error) {
            return (error as Error).message;
        }
    });
}
