import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
    NewsChannel,
    TextChannel,
    ThreadChannel,
} from "discord.js";
import { RateLimiter } from "discord.js-rate-limiter";

import { Command, CommandDeferType } from "@/commands/index.js";
import { DiscordLimits } from "@/constants/index.js";
import { EventHandler } from "@/events/index.js";
import { EventData } from "@/models/internal-models.js";
import { EventDataService, Lang, Logger } from "@/services/index.js";
import { CommandUtils, InteractionUtils } from "@/utils/index.js";
import Config from "~/config/config.json";
import Logs from "~/lang/logs.json";


// 一定要符合 EventHandler 接口，有 process()，多型 (Polymorphism)
export class CommandHandler implements EventHandler {
    private rateLimiter = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );

    constructor(
        public commands: Command[],
        private eventDataService: EventDataService
    ) {}

    // 執行一套標準化的流程，確保每個指令在執行前後都有一致的處理（例如權限檢查、頻率限制）
    public async process(intr: CommandInteraction | AutocompleteInteraction): Promise<void> {
        // 1. Don't respond to this bot itself, or other bots
        if (intr.user.id === intr.client.user?.id || intr.user.bot) {
            return;
        }

        // 2. 解析出完整的指令名稱 (包含子指令)
        const commandParts =
            intr instanceof ChatInputCommandInteraction || intr instanceof AutocompleteInteraction
                ? [
                      intr.commandName,
                      intr.options.getSubcommandGroup(false),
                      intr.options.getSubcommand(false),
                  ].filter(Boolean)
                : [intr.commandName];
        const commandName = commandParts.join(" ");

        // 3. Try to find the command the user wants
        const command = CommandUtils.findCommand(this.commands, commandParts);
        if (!command) {
            Logger.error(
                Logs.error.commandNotFound
                    .replaceAll("{INTERACTION_ID}", intr.id)
                    .replaceAll("{COMMAND_NAME}", commandName)
            );
            return;
        }

        if (intr instanceof AutocompleteInteraction) {
            if (!command.autocomplete) {
                Logger.error(
                    Logs.error.autocompleteNotFound
                        .replaceAll("{INTERACTION_ID}", intr.id)
                        .replaceAll("{COMMAND_NAME}", commandName)
                );
                return;
            }

            try {
                const option = intr.options.getFocused(true);
                const choices = await command.autocomplete(intr, option);
                await InteractionUtils.respond(
                    intr,
                    choices?.slice(0, DiscordLimits.CHOICES_PER_AUTOCOMPLETE)
                );
            } catch (error) {
                Logger.error(
                    intr.channel instanceof TextChannel ||
                        intr.channel instanceof NewsChannel ||
                        intr.channel instanceof ThreadChannel
                        ? Logs.error.autocompleteGuild
                              .replaceAll("{INTERACTION_ID}", intr.id)
                              .replaceAll("{OPTION_NAME}", commandName)
                              .replaceAll("{COMMAND_NAME}", commandName)
                              .replaceAll("{USER_TAG}", intr.user.tag)
                              .replaceAll("{USER_ID}", intr.user.id)
                              .replaceAll("{CHANNEL_NAME}", intr.channel.name)
                              .replaceAll("{CHANNEL_ID}", intr.channel.id)
                              .replaceAll("{GUILD_NAME}", intr.guild?.name)
                              .replaceAll("{GUILD_ID}", intr.guild?.id)
                        : Logs.error.autocompleteOther
                              .replaceAll("{INTERACTION_ID}", intr.id)
                              .replaceAll("{OPTION_NAME}", commandName)
                              .replaceAll("{COMMAND_NAME}", commandName)
                              .replaceAll("{USER_TAG}", intr.user.tag)
                              .replaceAll("{USER_ID}", intr.user.id),
                    error
                );
            }
            return;
        }

        // 4. Check if user is rate limited
        const limited = this.rateLimiter.take(intr.user.id);
        if (limited) {
            return;
        }

        // Defer Reply interaction
        // NOTE: Anything after this point we should be responding to the interaction
        // 這可以避免互動在 3 秒後逾時
        switch (command.deferType) {
            case CommandDeferType.PUBLIC: {
                await InteractionUtils.deferReply(intr, false);
                break;
            }
            case CommandDeferType.HIDDEN: {
                await InteractionUtils.deferReply(intr, true);
                break;
            }
        }

        // Return if defer was unsuccessful
        if (command.deferType !== CommandDeferType.NONE && !intr.deferred) {
            return;
        }

        // 6. 呼叫 EventDataService 來準備事件相關資料
        const eventData = await this.eventDataService.create({
            user: intr.user,
            channel: intr.channel,
            guild: intr.guild,
            args: intr instanceof ChatInputCommandInteraction ? intr.options : undefined,
        });

        try {
            // 7. Check if interaction passes command checks
            const passesChecks = await CommandUtils.runChecks(command, intr, eventData);
            if (passesChecks) {
                // 8. Execute the command
                await command.execute(intr, eventData);
            }
        } catch (error) {
            await this.sendError(intr, eventData);

            // Log command error
            Logger.error(
                intr.channel instanceof TextChannel ||
                    intr.channel instanceof NewsChannel ||
                    intr.channel instanceof ThreadChannel
                    ? Logs.error.commandGuild
                          .replaceAll("{INTERACTION_ID}", intr.id)
                          .replaceAll("{COMMAND_NAME}", commandName)
                          .replaceAll("{USER_TAG}", intr.user.tag)
                          .replaceAll("{USER_ID}", intr.user.id)
                          .replaceAll("{CHANNEL_NAME}", intr.channel.name)
                          .replaceAll("{CHANNEL_ID}", intr.channel.id)
                          .replaceAll("{GUILD_NAME}", intr.guild?.name)
                          .replaceAll("{GUILD_ID}", intr.guild?.id)
                    : Logs.error.commandOther
                          .replaceAll("{INTERACTION_ID}", intr.id)
                          .replaceAll("{COMMAND_NAME}", commandName)
                          .replaceAll("{USER_TAG}", intr.user.tag)
                          .replaceAll("{USER_ID}", intr.user.id),
                error
            );
        }
    }

    private async sendError(intr: CommandInteraction, data: EventData): Promise<void> {
        try {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed("errorEmbeds.command", data.lang, {
                    ERROR_CODE: intr.id,
                    GUILD_ID: intr.guild?.id ?? Lang.getRef("other.na", data.lang),
                    SHARD_ID: (intr.guild?.shardId ?? 0).toString(),
                })
            );
        } catch {
            // Ignore
        }
    }
}
