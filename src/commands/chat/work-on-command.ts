import { ChatInputCommandInteraction, PermissionsString } from "discord.js";
import { RateLimiter } from "discord.js-rate-limiter";

import { Command, CommandDeferType } from "@/commands/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { EventData } from "@/models/internal-models.js";
import { AttendanceService, Lang } from "@/services/index.js";
import { InteractionUtils } from "@/utils/index.js";
import Config from "~/config/config.json";

export class WorkOnCommand implements Command {
    public names = [Lang.getRef("chatCommands.workOn", Language.Default)];
    public cooldown = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const tasks = intr.options.getString(Lang.getRef("arguments.tasks", Language.Default));

        // Permission check
        if (!Config.developers.includes(intr.user.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.workOnNoPermission", data.lang)
            );
            return;
        }

        const attendanceService = AttendanceService.getInstance();
        const result = attendanceService.clockIn(intr.user.id, tasks);

        if (!result.success) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("errorEmbeds.workOnAlreadyClockedIn", data.lang, {
                    USER: intr.user.toString(),
                })
            );
            return;
        }

        await InteractionUtils.send(
            intr,
            Lang.getEmbed("displayEmbeds.workOnSuccess", data.lang, {
                USER: intr.user.toString(),
                TASKS: tasks,
            })
        );

        // Reminder for those who haven't clocked in
        const notClockedIn = attendanceService.getNotClockedInUsers(Config.developers);
        if (notClockedIn.length > 0) {
            const mentions = notClockedIn.map(id => `<@${id}>`).join(", ");
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.workOnReminder", data.lang, {
                    MENTIONS: mentions,
                })
            );
        }
    }
}
