import { TextChannel } from "discord.js";

import { CustomClient } from "@/extensions/index.js";
import { Job } from "@/jobs/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { AttendanceService, Lang, Logger } from "@/services/index.js";
import Config from "~/config/config.json";
import Logs from "~/lang/logs.json";

export class NoonReminderJob extends Job {
    public name = "Noon Reminder";
    public schedule: string = Config.jobs.reminders.noon.schedule;
    public log: boolean = Config.jobs.reminders.noon.log;
    public runOnce = false;
    public initialDelaySecs = 0;

    constructor(private client: CustomClient) {
        super();
    }

    public async run(): Promise<void> {
        if (!Config.jobs.reminders.noon.enabled) {
            return;
        }

        const attendanceService = AttendanceService.getInstance();
        const notClockedIn = attendanceService.getNotClockedInUsers(Config.developers);

        if (notClockedIn.length === 0) {
            return;
        }

        const mentions = notClockedIn.map(id => `<@${id}>`).join(", ");

        try {
            const channel = await this.client.channels.fetch(
                Config.jobs.reminders.noon.channelId
            );
            if (channel instanceof TextChannel) {
                await channel.send({
                    embeds: [
                        Lang.getEmbed("displayEmbeds.noonReminder", Language.Default, {
                            MENTIONS: mentions,
                        }),
                    ],
                });
            }
        } catch (error) {
            Logger.error(Logs.error.job.replaceAll("{JOB}", this.name), error);
        }
    }
}
