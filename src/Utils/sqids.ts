import Sqids from "sqids";
import {
    获取运行时配置
} from "../config";

type Sqids类别 = "register" | "coalition";

function 创建Sqids实例(类别: Sqids类别): Sqids {
    const 配置 = 获取运行时配置().sqids[类别];
    return new Sqids({
        alphabet: 配置.alphabet,
        minLength: 配置.minLength,
        blocklist: new Set(配置.blocklist),
    });
}

export function 获取注册Sqids(): Sqids {
    return 创建Sqids实例("register");
}

export function 获取联军Sqids(): Sqids {
    return 创建Sqids实例("coalition");
}