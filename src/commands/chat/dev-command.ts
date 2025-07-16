import djs, { ChatInputCommandInteraction, PermissionsString } from "discord.js";
import { createRequire } from "node:module";
import os from "node:os";
import typescript from "typescript";

import { Command, CommandDeferType } from "../index.js";

import { DevCommandName } from "@/enums/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { EventData } from "@/models/internal-models.js";
import { Lang } from "@/services/index.js";
import { FormatUtils, InteractionUtils, ShardUtils } from "@/utils/index.js";

const require = createRequire(import.meta.url);
const Config = require("~/config/config.json");
const TsConfig = require("~/tsconfig.json");

export class DevCommand implements Command {
    public names = [Lang.getRef("chatCommands.dev", Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // 檢查使用者是否為開發者
        if (!Config.developers.includes(intr.user.id)) {
            await InteractionUtils.send(intr, Lang.getEmbed("validationEmbeds.devOnly", data.lang));
            return;
        }

        const args = {
            command: intr.options.getString(
                Lang.getRef("arguments.command", Language.Default)
            ) as DevCommandName,
        };

        // INFO 子指令會收集關於 Bot、伺服器和系統的各種資訊，然後將這些資訊格式化並以嵌入式訊息 (embed) 的形式發送回覆。
        switch (args.command) {
            case DevCommandName.INFO: {
                //* intr.client: 代表 Client 物件，也就是 Bot 本身。
                //* intr.client.shard: 這是存取 Bot 的分片管理器 (`ShardClientUtil`)。分片是 Discord Bot 的一種擴展機制。當一個 Bot
                // 加入了非常多的伺服器時 (通常是超過 1000 個)，單一的連線程序會無法負荷。這時就需要將 Bot 分片，啟動多個獨立的程序，每個程序
                // (shard) 負責管理一部分的伺服器。
                const shardCount = intr.client.shard?.count ?? 1;
                let serverCount: number;
                if (intr.client.shard) {
                    try {
                        serverCount = await ShardUtils.serverCount(intr.client.shard);
                    } catch (error) {
                        if (error.name.includes("ShardingInProcess")) {
                            await InteractionUtils.send(
                                intr,
                                Lang.getEmbed("errorEmbeds.startupInProcess", data.lang)
                            );
                            return;
                        } else {
                            throw error;
                        }
                    }
                } else {
                    serverCount = intr.client.guilds.cache.size;
                }

                const memory = process.memoryUsage();

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed("displayEmbeds.devInfo", data.lang, {
                        NODE_VERSION: process.version,
                        TS_VERSION: `v${typescript.version}`,
                        ES_VERSION: TsConfig.compilerOptions.target,
                        DJS_VERSION: `v${djs.version}`,
                        SHARD_COUNT: shardCount.toLocaleString(data.lang),
                        SERVER_COUNT: serverCount.toLocaleString(data.lang),
                        SERVER_COUNT_PER_SHARD: Math.round(serverCount / shardCount).toLocaleString(
                            data.lang
                        ),
                        RSS_SIZE: FormatUtils.fileSize(memory.rss),
                        RSS_SIZE_PER_SERVER:
                            serverCount > 0
                                ? FormatUtils.fileSize(memory.rss / serverCount)
                                : Lang.getRef("other.na", data.lang),
                        HEAP_TOTAL_SIZE: FormatUtils.fileSize(memory.heapTotal),
                        HEAP_TOTAL_SIZE_PER_SERVER:
                            serverCount > 0
                                ? FormatUtils.fileSize(memory.heapTotal / serverCount)
                                : Lang.getRef("other.na", data.lang),
                        HEAP_USED_SIZE: FormatUtils.fileSize(memory.heapUsed),
                        HEAP_USED_SIZE_PER_SERVER:
                            serverCount > 0
                                ? FormatUtils.fileSize(memory.heapUsed / serverCount)
                                : Lang.getRef("other.na", data.lang),
                        HOSTNAME: os.hostname(),
                        SHARD_ID: (intr.guild?.shardId ?? 0).toString(),
                        SERVER_ID: intr.guild?.id ?? Lang.getRef("other.na", data.lang),
                        BOT_ID: intr.client.user?.id,
                        USER_ID: intr.user.id,
                    })
                );
                break;
            }
            default: {
                return;
            }
        }
    }
}
