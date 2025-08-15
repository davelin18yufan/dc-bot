import { REST } from "@discordjs/rest";
import { ClientOptions, Options, Partials } from "discord.js";
import { createRequire } from "node:module";

import { Button } from "@/buttons/index.js";
import {
    BugsCommand,
    DevCommand,
    HelpCommand,
    InfoCommand,
    ProjectCommand,
    TestCommand,
} from "@/commands/chat/index.js";
import {
    ChatCommandMetadata,
    Command,
    MessageCommandMetadata,
    UserCommandMetadata,
} from "@/commands/index.js";
import { ViewDateSent } from "@/commands/message/index.js";
import { ViewDateJoined } from "@/commands/user/index.js";
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from "@/events/index.js";
import { CustomClient } from "@/extensions/index.js";
import { ClearAttendanceJob, EveningReminderJob, Job, NoonReminderJob } from "@/jobs/index.js";
import { Bot } from "@/models/bot.js";
import { Reaction } from "@/reactions/index.js";
import {
    CommandRegistrationService,
    EventDataService,
    JobService,
    Logger,
} from "@/services/index.js";
import { Trigger } from "@/triggers/index.js";
import Config from "~/config/config.json";

const require = createRequire(import.meta.url);
const Logs = require("~/lang/logs.json");

async function start(): Promise<void> {
    // Services
    const eventDataService = new EventDataService();

    // Client
    const client = new CustomClient({
        intents: Config.client.intents as ClientOptions["intents"], // 需要從 Discord 接收哪些類型的事件通知 (例如：新訊息、成員加入等)。
        partials: Config.client.partials.map(partial => Partials[partial]), // 處理一些不完整的資料，例如在機器人離線時收到的訊息。
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.DefaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
        enforceNonce: true,
    });

    // Commands
    const commands: Command[] = [
        // Chat Commands
        new DevCommand(),
        new HelpCommand(),
        new InfoCommand(),
        new TestCommand(),
        new ProjectCommand(),
        new BugsCommand(),

        // Message Context Commands
        new ViewDateSent(),

        // User Context Commands
        new ViewDateJoined(),

        // TODO: Add new commands here
    ];

    // Buttons
    const buttons: Button[] = [
        // TODO: Add new buttons here
    ];

    // Reactions
    const reactions: Reaction[] = [
        // TODO: Add new reactions here
    ];

    // Triggers
    const triggers: Trigger[] = [
        // TODO: Add new triggers here
    ];

    //* Discord.js 的運作方式是基於事件的。例如，當有人輸入指令時，會觸發一個 "interactionCreate" 事件；當有人加入伺服器時，會觸發一個 "guildCreate" 事件。
    // Event handlers
    const guildJoinHandler = new GuildJoinHandler(eventDataService);
    const guildLeaveHandler = new GuildLeaveHandler();
    const commandHandler = new CommandHandler(commands, eventDataService);
    const buttonHandler = new ButtonHandler(buttons, eventDataService);
    const triggerHandler = new TriggerHandler(triggers, eventDataService);
    const messageHandler = new MessageHandler(triggerHandler);
    const reactionHandler = new ReactionHandler(reactions, eventDataService);

    // Jobs
    const jobs: Job[] = [
        new ClearAttendanceJob(),
        new EveningReminderJob(client),
        new NoonReminderJob(client),
        // TODO: Add new jobs here
    ];

    // Bot
    const bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        buttonHandler,
        reactionHandler,
        new JobService(jobs)
    );

    /**
     * `process.argv` 是一個陣列，包含了您在終端機輸入的指令。
     * 如果您執行的是 `npm run commands:register`，那麼 `process.argv[2]` 就會是 commands，而 `process.argv[3]` 會是 register。
     * 這段程式碼的用途是：只註冊指令，而不啟動機器人。它會將您定義的所有指令資訊 (名稱、描述、選項等) 發送到 Discord API，讓 Discord 知道您的機器人有哪些指令可以用。註冊完後，程式就會用 `process.exit()` 結束。
     */
    // Register
    if (process.argv[2] == "commands") {
        try {
            const rest = new REST({ version: "10" }).setToken(Config.client.token);
            const commandRegistrationService = new CommandRegistrationService(rest);
            const localCmds = [
                ...Object.values(ChatCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(MessageCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(UserCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            ];
            await commandRegistrationService.process(localCmds, process.argv);
        } catch (error) {
            Logger.error(Logs.error.commandAction, error);
        }
        // Wait for any final logs to be written.
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.exit();
    }

    await bot.start();
}

process.on("unhandledRejection", (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});

//  npm run start -> npm -> tsc (編譯 src 到 dist) -> Node.js -> 執行 dist/start-bot.js -> 程式碼 -> 建立 Client -> 載入指令 ->
//   設定事件處理器 -> 登入 Discord -> 開始監聽事件 -> 機器人上線！
