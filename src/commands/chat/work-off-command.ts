import { ChatInputCommandInteraction, PermissionsString } from "discord.js";
import { RateLimiter } from "discord.js-rate-limiter";

import { Command, CommandDeferType } from "@/commands/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { EventData } from "@/models/internal-models.js";
import { AttendanceService, Lang } from "@/services/index.js";
import { InteractionUtils } from "@/utils/index.js";
import Config from "~/config/config.json";

export class WorkOffCommand implements Command {
    public names = [Lang.getRef("chatCommands.workOff", Language.Default)];
    public cooldown = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const progress = intr.options.getString(
            Lang.getRef("arguments.progress", Language.Default)
        );

        // Permission check
        if (!Config.developers.includes(intr.user.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.workOffNoPermission", data.lang)
            );
            return;
        }

        const attendanceService = AttendanceService.getInstance();
        const result = attendanceService.clockOut(intr.user.id);

        if (!result.success) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("errorEmbeds.workOffNotClockedIn", data.lang, {
                    USER: intr.user.toString(),
                })
            );
            return;
        }

        await InteractionUtils.send(
            intr,
            Lang.getEmbed("displayEmbeds.workOffSuccess", data.lang, {
                USER: intr.user.toString(),
                PROGRESS: progress,
            })
        );

        // Reminder for those who haven't clocked off
        const stillClockedIn = attendanceService.getClockedInUsers();
        if (stillClockedIn.length > 0) {
            const mentions = stillClockedIn.map(id => `<@${id}>`).join(", ");
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.workOffReminder", data.lang, {
                    MENTIONS: mentions,
                })
            );
        }
    }
}
