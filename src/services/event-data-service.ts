import {
    Channel,
    CommandInteractionOptionResolver,
    Guild,
    PartialDMChannel,
    User,
} from "discord.js";

import { Language } from "@/models/enum-helpers/language.js";
import { EventData } from "@/models/internal-models.js";

//* 職責是「為事件準備上下文資料」。當一個事件（如指令互動）發生時，通常需要一些額外的資訊，例如使用者的偏好語言、伺服器的設定等等。
export class EventDataService {
    public async create(
        options: {
            user?: User;
            channel?: Channel | PartialDMChannel;
            guild?: Guild;
            args?: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">;
        } = {}
    ): Promise<EventData> {
        // TODO: Retrieve any data you want to pass along in events

        // 根據伺服器的偏好地區設定，決定要用哪種語言
        // Event language
        const lang =
            options.guild?.preferredLocale &&
            Language.Enabled.includes(options.guild.preferredLocale)
                ? options.guild.preferredLocale
                : Language.Default;

        // Guild language
        const langGuild =
            options.guild?.preferredLocale &&
            Language.Enabled.includes(options.guild.preferredLocale)
                ? options.guild.preferredLocale
                : Language.Default;

        return new EventData(lang, langGuild);
    }
}
