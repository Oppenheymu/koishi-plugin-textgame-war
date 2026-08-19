// 一次性脚本：目录规范化重命名 + import 路径与变量名批量替换（用完即删，幂等可重跑）
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 1. 目录/文件移动（git mv，目标已存在则跳过，带重试） ----------
const moves = [
    ["src/infrastructure/版本日志", "src/infrastructure/changelog"],
    ["src/infrastructure/插件加载", "src/infrastructure/plugin-loader"],
    ["src/infrastructure/游戏记录", "src/infrastructure/game-record"],
    ["src/infrastructure/游戏资源", "src/infrastructure/game-assets"],
    ["src/interfaces/commands/coalition/查询相关", "src/interfaces/commands/coalition/查询"],
    ["src/interfaces/commands/coalition/分配相关", "src/interfaces/commands/coalition/分配"],
    ["src/interfaces/commands/coalition/权限相关", "src/interfaces/commands/coalition/权限"],
    ["src/interfaces/commands/common/改名相关", "src/interfaces/commands/common/改名"],
    ["src/interfaces/commands/common/跨端相关", "src/interfaces/commands/common/跨端"],
    ["src/interfaces/admin/稽查相关", "src/interfaces/admin/稽查"],
    ["src/interfaces/admin/预设相关", "src/interfaces/admin/预设"],
    ["src/contexts/coalition/application/权力动态分配", "src/contexts/coalition/application/power-dynamics"],
    ["src/contexts/coalition/application/生产总值统计", "src/contexts/coalition/application/gdp-stats"],
    ["src/contexts/beacon/地区", "src/contexts/beacon/domain/district"],
    ["src/contexts/beacon/新闻", "src/contexts/beacon/domain/news"],
    ["src/contexts/beacon/联军", "src/contexts/beacon/domain/coalition"],
    ["src/contexts/beacon/后台", "src/contexts/beacon/application/backend"],
    ["src/contexts/beacon/utils.ts", "src/contexts/beacon/infrastructure/utils.ts"],
    ["src/contexts/naming/工单服务.ts", "src/contexts/naming/application/工单服务.ts"],
    ["src/contexts/naming/state.ts", "src/contexts/naming/infrastructure/审核群号.ts"],
    ["src/shared/target", "src/interfaces/commands/common/target"],
];

const failed = [];
for (const [from, to] of moves) {
    if (existsSync(join(root, to))) {
        console.log(`skip (target exists): ${to}`);
        continue;
    }
    mkdirSync(join(root, to, ".."), { recursive: true });
    let done = false;
    for (let i = 0; i < 6 && !done; i++) {
        try {
            execSync(`git mv "${from}" "${to}"`, { cwd: root, stdio: "pipe" });
            done = true;
            console.log(`moved: ${from} -> ${to}`);
        } catch {
            console.log(`retry ${i + 1}: ${from}`);
            await sleep(1500);
        }
    }
    if (!done) failed.push([from, to]);
}
if (failed.length) {
    console.error("FAILED MOVES:", failed);
}

// ---------- 2. 文本替换（幂等） ----------
const pathMap = [
    ["#/interfaces/commands/coalition/查询相关", "#/interfaces/commands/coalition/查询"],
    ["#/interfaces/commands/coalition/分配相关", "#/interfaces/commands/coalition/分配"],
    ["#/interfaces/commands/coalition/权限相关", "#/interfaces/commands/coalition/权限"],
    ["#/interfaces/commands/common/改名相关", "#/interfaces/commands/common/改名"],
    ["#/interfaces/commands/common/跨端相关", "#/interfaces/commands/common/跨端"],
    ["#/interfaces/admin/稽查相关", "#/interfaces/admin/稽查"],
    ["#/interfaces/admin/预设相关", "#/interfaces/admin/预设"],
    ["#ctx/coalition/application/权力动态分配", "#ctx/coalition/application/power-dynamics"],
    ["#ctx/coalition/application/生产总值统计", "#ctx/coalition/application/gdp-stats"],
    ["#ctx/beacon/地区", "#ctx/beacon/domain/district"],
    ["#ctx/beacon/新闻", "#ctx/beacon/domain/news"],
    ["#ctx/beacon/联军", "#ctx/beacon/domain/coalition"],
    ["#ctx/beacon/后台", "#ctx/beacon/application/backend"],
    ["#ctx/beacon/utils", "#ctx/beacon/infrastructure/utils"],
    ["#ctx/naming/工单服务", "#ctx/naming/application/工单服务"],
    ["#ctx/naming/state", "#ctx/naming/infrastructure/审核群号"],
    ["#shared/target", "#/interfaces/commands/common/target"],
    ["#/infrastructure/版本日志", "#/infrastructure/changelog"],
    ["#/infrastructure/插件加载", "#/infrastructure/plugin-loader"],
    ["#/infrastructure/游戏记录", "#/infrastructure/game-record"],
    ["#/infrastructure/游戏资源", "#/infrastructure/game-assets"],
    ["src/interfaces/commands/coalition/分配相关/", "src/interfaces/commands/coalition/分配/"],
    ["src/interfaces/commands/coalition/权限相关/", "src/interfaces/commands/coalition/权限/"],
    ["src/interfaces/admin/预设相关/", "src/interfaces/admin/预设/"],
];

// 指令数组变量名统一（去「相关」，列表数组以「指令」结尾）
const varMap = [
    ["查询相关指令", "查询指令"],
    ["权限相关指令", "权限指令"],
    ["分配相关指令", "分配指令"],
    ["改名相关指令", "改名指令"],
    ["跨端相关指令", "跨端指令"],
    ["稽查相关指令", "稽查指令"],
    ["预设相关指令", "预设指令"],
    ["地区权限相关指令", "地区权限指令"],
    ["地堡查询相关", "地堡查询指令"],
    ["地堡相关指令", "地堡指令"],
    ["权限管理相关", "权限管理指令"],
    ["个人相关", "个人指令"],
    ["列表相关", "列表指令"],
];

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) yield* walk(p);
        else if (/\.(ts|json)$/.test(name)) yield p;
    }
}

const report = [];
for (const file of walk(join(root, "src"))) {
    let content = readFileSync(file, "utf8");
    const original = content;
    const hits = [];
    for (const [from, to] of [...pathMap, ...varMap]) {
        if (content.includes(from)) {
            const n = content.split(from).length - 1;
            content = content.split(from).join(to);
            hits.push(`${from} -> ${to} (${n})`);
        }
    }
    if (content !== original) {
        writeFileSync(file, content, "utf8");
        report.push({ file: file.replace(root + "\\", ""), hits });
    }
}

// shared/index.ts 删除 target 的 re-export 行
const sharedIndex = join(root, "src/shared/index.ts");
const si = readFileSync(sharedIndex, "utf8").replace('export * from "./target/index.js";\n', "");
writeFileSync(sharedIndex, si, "utf8");
console.log("shared/index.ts: target re-export removed");

// .fallowrc.json 也做替换
const fallowrc = join(root, ".fallowrc.json");
let fc = readFileSync(fallowrc, "utf8");
for (const [from, to] of pathMap) fc = fc.split(from).join(to);
writeFileSync(fallowrc, fc, "utf8");

console.log(`\n=== ${report.length} files text-replaced ===`);
for (const r of report) console.log(`${r.file}\n  ${r.hits.join("\n  ")}`);
