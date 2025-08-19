import { Message } from "discord.js";

import { EventHandler, TriggerHandler } from "./index.js";

// 當機器人收到任何訊息時會被觸發
export class MessageHandler implements EventHandler {
    constructor(private triggerHandler: TriggerHandler) {}

    public async process(msg: Message): Promise<void> {
        // Don't respond to system messages or self
        if (msg.system || msg.author.id === msg.client.user?.id) {
            return;
        }

        // Process trigger 將收到的訊息物件 (message) 傳遞
        await this.triggerHandler.process(msg);
    }
}
