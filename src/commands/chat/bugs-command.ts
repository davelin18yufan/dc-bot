import { ChatInputCommandInteraction, PermissionsString } from "discord.js";
import { RateLimiter } from "discord.js-rate-limiter";

import { Command, CommandDeferType } from "@/commands/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { EventData } from "@/models/internal-models.js";
import { HttpService, Lang } from "@/services/index.js";
import { InteractionUtils, JwtUtils } from "@/utils/index.js";
import Config from "~/config/config.json";

export class BugsCommand implements Command {
    public names = [Lang.getRef("chatCommands.bugs", Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const status = intr.options.getString(Lang.getRef("arguments.status", Language.Default));
        const assignee = intr.options.getUser(Lang.getRef("arguments.assignee", Language.Default));

        // Permission check
        const allowedUserIds = [...Config.developers, ...Config.pms];
        const hasPermission = allowedUserIds.includes(intr.user.id);

        if (!hasPermission) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.bugsNoPermission", data.lang)
            );
            return;
        }

        // Defer the reply
        await intr.deferReply({ ephemeral: this.deferType === CommandDeferType.HIDDEN });

        try {
            const token = JwtUtils.generateJwt(intr.user);
            const response = await HttpService.getInstance().post(
                Config.webhooks.bugs,
                `Bearer ${token}`,
                {
                    status: status || "all",
                    assignee: assignee
                        ? {
                              id: assignee.id,
                              username: assignee.username,
                              globalName: assignee.globalName || assignee.username,
                          }
                        : null,
                }
            );

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }

            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.bugsQuerySent", data.lang, {
                    STATUS: status || "Open & Pending",
                })
            );
        } catch (error) {
            console.error(error);
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("errorEmbeds.bugsQueryFailed", data.lang, {
                    STATUS: status || "Open & Pending",
                })
            );
        }
    }
}
