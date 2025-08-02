import { ChatInputCommandInteraction, PermissionsString } from "discord.js";
import { RateLimiter } from "discord.js-rate-limiter";

import { Command, CommandDeferType } from "@/commands/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { EventData } from "@/models/internal-models.js";
import { HttpService, Lang } from "@/services/index.js";
import { InteractionUtils, JwtUtils } from "@/utils/index.js";
import Config from "~/config/config.json";

export class ProjectCommand implements Command {
    public names = [Lang.getRef("chatCommands.project", Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const projectName = intr.options.getString(
            Lang.getRef("arguments.projectName", Language.Default)
        );
        const question = intr.options.getString(
            Lang.getRef("arguments.question", Language.Default)
        );

        // Permission check
        const allowedUserIds = [...Config.developers, ...Config.pms];
        const hasPermission = allowedUserIds.includes(intr.user.id);

        if (!hasPermission) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.projectNoPermission", data.lang)
            );
            return;
        }

        // Defer the reply
        await intr.deferReply({ ephemeral: this.deferType === CommandDeferType.HIDDEN });

        try {
            const token = JwtUtils.generateJwt(intr.user);
            const httpService = HttpService.getInstance();
            const response = await httpService.post(Config.webhooks.projects, `Bearer ${token}`, {
                projectName,
                question,
            });

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }

            // Let n8n handle the response, but confirm to the user that the request was sent.
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.projectQuerySent", data.lang, {
                    PROJECT_NAME: projectName,
                })
            );
        } catch (error) {
            // Log error and inform user
            console.error(error);
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("errorEmbeds.projectQueryFailed", data.lang, {
                    PROJECT_NAME: projectName,
                })
            );
        }
    }
}
