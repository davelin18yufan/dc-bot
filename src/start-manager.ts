import { ShardingManager, ShardingManagerMode } from "discord.js";
import "reflect-metadata";

import { GuildsController, RootController, ShardsController } from "@/controllers/index.js";
import { Job, UpdateServerCountJob } from "@/jobs/index.js";
import { Api } from "@/models/api.js";
import { Manager } from "@/models/manager.js";
import { HttpService, JobService, Logger, MasterApiService } from "@/services/index.js";
import { MathUtils, ShardUtils } from "@/utils/index.js";
import Config from "~/config/config.json";
import Debug from "~/config/debug.json";
import Logs from "~/lang/logs.json";

/**
 * 啟動、管理和監控一個或多個機器人子程序 (Shards)
 */
async function start(): Promise<void> {
    Logger.info(Logs.info.appStarted);

    // Dependencies
    const httpService = new HttpService();
    const masterApiService = new MasterApiService(httpService);
    if (Config.clustering.enabled) {
        await masterApiService.register();
    }

    // Sharding
    let shardList: number[];
    let totalShards: number;
    try {
        // Manager 需要知道它要啟動哪些分片 (shardList) 以及總共有多少分片 (totalShards)。
        if (Config.clustering.enabled) {
            // 叢集模式
            const resBody = await masterApiService.login(); // 獲取分配給它的 shardList 和 totalShards
            shardList = resBody.shardList;
            const requiredShards = await ShardUtils.requiredShardCount(Config.client.token);
            totalShards = Math.max(requiredShards, resBody.totalShards);
        } else {
            // 獨立模式
            const recommendedShards = await ShardUtils.recommendedShardCount(
                Config.client.token,
                Config.sharding.serversPerShard // 根據設定好的分片數量
            );
            shardList = MathUtils.range(0, recommendedShards);
            totalShards = recommendedShards;
        }
    } catch (error) {
        Logger.error(Logs.error.retrieveShards, error);
        return;
    }

    if (shardList.length === 0) {
        Logger.warn(Logs.warn.managerNoShards);
        return;
    }

    // 每個分片子程序應該運行哪個檔案。 Manager 和實際 Bot 邏輯分離的地方;
    const shardManager = new ShardingManager("dist/start-bot.js", {
        token: Config.client.token,
        mode: Debug.override.shardMode.enabled
            ? (Debug.override.shardMode.value as ShardingManagerMode)
            : "process",
        respawn: true,
        totalShards,
        shardList,
    });

    // Jobs 背景任務
    const jobs: Job[] = [
        Config.clustering.enabled ? undefined : new UpdateServerCountJob(shardManager, httpService), // 將機器人伺服器數量發布到機器人列表網站
        // TODO: Add new jobs here
    ].filter(Boolean); // 過濾掉陣列中的 undefined 值

    const manager = new Manager(shardManager, new JobService(jobs));

    // API
    const guildsController = new GuildsController(shardManager);
    const shardsController = new ShardsController(shardManager);
    const rootController = new RootController();
    const api = new Api([guildsController, shardsController, rootController]);

    // Start
    await manager.start(); // 觸發 ShardingManager 的 spawn() 方法來啟動所有分片子程序，並啟動 JobService。
    await api.start(); // 啟動 API 伺服器，使其可以接收請求
    if (Config.clustering.enabled) {
        // 通知主服務已經準備就緒，所有分配給它的分片都已成功啟動
        await masterApiService.ready(); 
    }
}

process.on("unhandledRejection", (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
