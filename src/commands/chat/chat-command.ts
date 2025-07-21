import { ChatInputCommandInteraction, PermissionsString } from "discord.js";
import { RateLimiter } from "discord.js-rate-limiter";

import { Command, CommandDeferType } from "@/commands/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { EventData } from "@/models/internal-models.js";
import { Lang } from "@/services/index.js";
import { InteractionUtils } from "@/utils/index.js";
import Config from "~/config/config.json";

export class ChatCommand implements Command {
    public names = [Lang.getRef("chatCommands.chat", Language.Default)];
    public cooldown = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const question = intr.options.getString(
            Lang.getRef("arguments.question", Language.Default)
        );

        // Permission check
        const allowedUserIds = [...Config.developers, ...Config.pms];
        const hasPermission = allowedUserIds.includes(intr.user.id);

        if (!hasPermission) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("displayEmbeds.chatNoPermission", data.lang)
            );
            return;
        }

        // Defer the reply
        await intr.deferReply({ ephemeral: this.deferType === CommandDeferType.HIDDEN });

        try {
            const response = await fetch(Config.webhooks.chat, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }

            const responseData = await response.json();

            await InteractionUtils.send(intr, {
                content: (responseData as any).content,
                embeds: [],
            });
        } catch (error) {
            // Log error and inform user
            console.error(error);
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("errorEmbeds.chatQueryFailed", data.lang, {
                    QUESTION: question,
                })
            );
        }
    }
}
