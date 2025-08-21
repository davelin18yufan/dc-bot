import { Message } from "discord.js";

import { EventData } from "@/models/internal-models.js";

export interface Trigger {
    requireGuild: boolean; // 如果設為 true，這個 Trigger 只會在伺服器頻道中作用，私訊中則會被忽略
    triggered(msg: Message): boolean; // 檢查訊息內容是否包含特定文字、是否有附件 => 被觸發
    execute(msg: Message, data: EventData): Promise<void>; // trigger 被觸發後執行的動作
}
