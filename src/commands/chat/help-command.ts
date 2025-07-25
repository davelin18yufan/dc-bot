import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from "discord.js";

import { Command, CommandDeferType } from "../index.js";

import { HelpOption } from "@/enums/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { EventData } from "@/models/internal-models.js";
import { Lang } from "@/services/index.js";
import { ClientUtils, FormatUtils, InteractionUtils } from "@/utils/index.js";

export class HelpCommand implements Command {
    public names = [Lang.getRef("chatCommands.help", Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const args = {
            option: intr.options.getString(
                Lang.getRef("arguments.option", Language.Default)
            ) as HelpOption,
        };
        
        // 根據傳進來的選項決定要顯示的內容
        let embed: EmbedBuilder;
        switch (args.option) {
            case HelpOption.CONTACT_SUPPORT: {
                embed = Lang.getEmbed("displayEmbeds.helpContactSupport", data.lang);
                break;
            }
            case HelpOption.COMMANDS: {
                embed = Lang.getEmbed("displayEmbeds.helpCommands", data.lang, {
                    CMD_LINK_TEST: FormatUtils.commandMention(
                        await ClientUtils.findAppCommand(
                            intr.client,
                            Lang.getRef("chatCommands.test", Language.Default)
                        )
                    ),
                    CMD_LINK_INFO: FormatUtils.commandMention(
                        await ClientUtils.findAppCommand(
                            intr.client,
                            Lang.getRef("chatCommands.info", Language.Default)
                        )
                    ),
                });
                break;
            }
            default: {
                return;
            }
        }

        await InteractionUtils.send(intr, embed);
    }
}
