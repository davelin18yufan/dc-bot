import { TextChannel } from "discord.js";

import { CustomClient } from "@/extensions/index.js";
import { Job } from "@/jobs/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { AttendanceService, Lang, Logger } from "@/services/index.js";
import Config from "~/config/config.json";
import Logs from "~/lang/logs.json";

export class EveningReminderJob extends Job {
    public name = "Evening Reminder";
    public schedule: string = Config.jobs.reminders.evening.schedule;
    public log: boolean = Config.jobs.reminders.evening.log;
    public runOnce = false;
    public initialDelaySecs = 0;

    constructor(private client: CustomClient) {
        super();
    }

    public async run(): Promise<void> {
        if (!Config.jobs.reminders.evening.enabled) {
            return;
        }

        const attendanceService = AttendanceService.getInstance();
        const stillClockedIn = attendanceService.getClockedInUsers();

        if (stillClockedIn.length === 0) {
            return;
        }

        const mentions = stillClockedIn.map(id => `<@${id}>`).join(", ");

        try {
            const channel = await this.client.channels.fetch(
                Config.jobs.reminders.evening.channelId
            );
            if (channel instanceof TextChannel) {
                await channel.send({
                    embeds: [
                        Lang.getEmbed("displayEmbeds.eveningReminder", Language.Default, {
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
