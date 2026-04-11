export function 解析引用工单编号(引用文本: string | undefined): number | null {
    const 编号文本 = 引用文本?.match(/改名工单\s*#(\d+)/)?.[1];
    if (!编号文本) return null;

    const 编号 = Number(编号文本);
    if (!Number.isInteger(编号) || 编号 <= 0) return null;

    return 编号;
}
