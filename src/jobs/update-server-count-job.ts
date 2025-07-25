import { ActivityType, ShardingManager } from "discord.js";

import { CustomClient } from "@/extensions/index.js";
import { Job } from "@/jobs/index.js";
import { BotSite } from "@/models/config-models.js";
import { HttpService, Lang, Logger } from "@/services/index.js";
import { ShardUtils } from "@/utils/index.js";
import BotSites from "~/config/bot-sites.json";
import Config from "~/config/config.json";
import Logs from "~/lang/logs.json";

export class UpdateServerCountJob extends Job {
    public name = "Update Server Count";
    public schedule: string = Config.jobs.updateServerCount.schedule;
    public log: boolean = Config.jobs.updateServerCount.log;
    public runOnce: boolean = Config.jobs.updateServerCount.runOnce;
    public initialDelaySecs: number = Config.jobs.updateServerCount.initialDelaySecs;

    private botSites: BotSite[];

    constructor(
        private shardManager: ShardingManager,
        private httpService: HttpService
    ) {
        super();
        this.botSites = BotSites.filter(botSite => botSite.enabled);
    }

    public async run(): Promise<void> {
        const serverCount = await ShardUtils.serverCount(this.shardManager);

        const type = ActivityType.Streaming;
        const name = `to ${serverCount.toLocaleString()} servers`;
        const url = Lang.getCom("links.stream");

        await this.shardManager.broadcastEval(
            (client, context) => {
                const customClient = client as CustomClient;
                return customClient.setPresence(
                    context.type as Exclude<ActivityType, ActivityType.Custom>,
                    context.name,
                    context.url
                );
            },
            { context: { type, name, url } }
        );

        Logger.info(
            Logs.info.updatedServerCount.replaceAll("{SERVER_COUNT}", serverCount.toLocaleString())
        );

        for (const botSite of this.botSites) {
            try {
                const body = JSON.parse(
                    botSite.body.replaceAll("{{SERVER_COUNT}}", serverCount.toString())
                );
                const res = await this.httpService.post(botSite.url, botSite.authorization, body);

                if (!res.ok) {
                    throw res;
                }
            } catch (error) {
                Logger.error(
                    Logs.error.updatedServerCountSite.replaceAll("{BOT_SITE}", botSite.name),
                    error
                );
                continue;
            }

            Logger.info(Logs.info.updatedServerCountSite.replaceAll("{BOT_SITE}", botSite.name));
        }
    }
}
