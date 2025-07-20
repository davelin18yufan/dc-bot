import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from "discord.js";

import { BugStatus, DevCommandName, HelpOption, InfoOption } from "@/enums/index.js";
import { Language } from "@/models/enum-helpers/index.js";
import { Lang } from "@/services/index.js";

export class Args {
    public static readonly DEV_COMMAND: APIApplicationCommandBasicOption = {
        name: Lang.getRef("arguments.command", Language.Default),
        name_localizations: Lang.getRefLocalizationMap("arguments.command"),
        description: Lang.getRef("argDescs.devCommand", Language.Default),
        description_localizations: Lang.getRefLocalizationMap("argDescs.devCommand"),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef("devCommandNames.info", Language.Default),
                name_localizations: Lang.getRefLocalizationMap("devCommandNames.info"),
                value: DevCommandName.INFO,
            },
        ],
    };
    public static readonly HELP_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef("arguments.option", Language.Default),
        name_localizations: Lang.getRefLocalizationMap("arguments.option"),
        description: Lang.getRef("argDescs.helpOption", Language.Default),
        description_localizations: Lang.getRefLocalizationMap("argDescs.helpOption"),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef("helpOptionDescs.contactSupport", Language.Default),
                name_localizations: Lang.getRefLocalizationMap("helpOptionDescs.contactSupport"),
                value: HelpOption.CONTACT_SUPPORT,
            },
            {
                name: Lang.getRef("helpOptionDescs.commands", Language.Default),
                name_localizations: Lang.getRefLocalizationMap("helpOptionDescs.commands"),
                value: HelpOption.COMMANDS,
            },
        ],
    };
    public static readonly INFO_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef("arguments.option", Language.Default),
        name_localizations: Lang.getRefLocalizationMap("arguments.option"),
        description: Lang.getRef("argDescs.helpOption", Language.Default),
        description_localizations: Lang.getRefLocalizationMap("argDescs.helpOption"),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef("infoOptions.about", Language.Default),
                name_localizations: Lang.getRefLocalizationMap("infoOptions.about"),
                value: InfoOption.ABOUT,
            },
            {
                name: Lang.getRef("infoOptions.translate", Language.Default),
                name_localizations: Lang.getRefLocalizationMap("infoOptions.translate"),
                value: InfoOption.TRANSLATE,
            },
        ],
    };
    public static readonly PROJECT_NAME: APIApplicationCommandBasicOption = {
        name: Lang.getRef("arguments.projectName", Language.Default),
        name_localizations: Lang.getRefLocalizationMap("arguments.projectName"),
        description: Lang.getRef("argDescs.projectName", Language.Default),
        description_localizations: Lang.getRefLocalizationMap("argDescs.projectName"),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly STATUS: APIApplicationCommandBasicOption = {
        name: Lang.getRef("arguments.status", Language.Default),
        name_localizations: Lang.getRefLocalizationMap("arguments.status"),
        description: Lang.getRef("argDescs.status", Language.Default),
        description_localizations: Lang.getRefLocalizationMap("argDescs.status"),
        type: ApplicationCommandOptionType.String,
        choices: Object.values(BugStatus).map(status => ({
            name: status,
            value: status,
        })),
    };
    public static readonly ASSIGNEE: APIApplicationCommandBasicOption = {
        name: Lang.getRef("arguments.assignee", Language.Default),
        name_localizations: Lang.getRefLocalizationMap("arguments.assignee"),
        description: Lang.getRef("argDescs.assignee", Language.Default),
        description_localizations: Lang.getRefLocalizationMap("argDescs.assignee"),
        type: ApplicationCommandOptionType.User,
    };
}
