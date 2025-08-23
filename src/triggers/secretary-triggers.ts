import { Message } from "discord.js";

import { EventData } from "@/models/internal-models.js";
import { Trigger } from "@/triggers/trigger.js";

export class MorningTrigger implements Trigger {
    public requireGuild = false;

    private responses = [
        "早安... 一大早就來了，這麼有幹勁啊？不像我，只想喝咖啡。",
        "哦，早。昨天的報告放我桌上了嗎？沒有就快去弄。",
        "早...（打哈欠）... 欸，你來啦。幫我泡杯咖啡，謝謝。",
        "早安！看你這麼精神，今天的工作量加倍好了。",
        "喔嗨喲，今天有什麼特別的計畫嗎？如果沒有，就先把我的工作拿去做吧。",
        "不早了，今天的會議準備好了嗎？別忘了帶上你的筆記本。",
    ];

    public triggered(msg: Message): boolean {
        return msg.content.includes("秘書早安") || msg.content.includes("秘書早") || msg.content.includes("金早") 
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        const randomResponse = this.responses[Math.floor(Math.random() * this.responses.length)];
        await msg.reply(randomResponse);
    }
}

export class AfternoonTrigger implements Trigger {
    public requireGuild = false;

    private responses = [
        "午安，剛吃飽就想睡覺了... 你下午有什麼安排？沒事的話就去把茶水間的咖啡補一下。",
        "午安。下午茶想好了嗎？我今天想吃起司蛋糕。",
        "都下午了啊... 時間過得真慢。對了，提醒你一下，你欠我的進度還沒給我，別忘了。",
    ];

    public triggered(msg: Message): boolean {
        return msg.content.includes("秘書午安");
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        const randomResponse = this.responses[Math.floor(Math.random() * this.responses.length)];
        await msg.reply(randomResponse);
    }
}

export class HelloTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return (
            msg.content.includes("你好") ||
            msg.content.includes("哈囉") ||
            msg.content.includes("嗨")
        );
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        await msg.reply("哼，現在才來打招呼？找我有事就快說。");
    }
}

export class MeetingTrigger implements Trigger {
    public requireGuild = false;

    private responses = [
        "會議、會議，每天都是會議... 資料準備好了嗎？別浪費我的時間喔。",
        "又要開會了嗎? 真希望能直接跳過這些無聊的討論。",
        "會議時間到了，戴上你的筆記本咖啡跟尊敬我的心，Let's go!",
        "...，走吧。"
    ];

    public triggered(msg: Message): boolean {
        return msg.content.includes("開會") || msg.content.includes("會議");
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        const randomResponses = this.responses[Math.floor(Math.random() * this.responses.length)];
        await msg.reply(randomResponses);
    }
}

export class LunchTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return (
            msg.content.includes("午餐") ||
            msg.content.includes("吃飯") ||
            msg.content.includes("肚子餓")
        );
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        await msg.reply("就知道吃！訂外送了沒？別忘了順便幫我點一杯無糖拿鐵，謝謝～");
    }
}

export class ThanksTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return msg.content.includes("辛苦了") || msg.content.includes("感謝");
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        await msg.reply("知道我辛苦就好。那...下午茶的點心準備好了嗎？");
    }
}

export class EndOfWorkTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return msg.content.includes("下班");
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        await msg.reply("想下班了？工作都做完了嗎？真是的...好吧，路上小心點，明天可不准遲到！");
    }
}

export class ByeByeTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return msg.content.includes("掰掰") || msg.content.includes("再見");
    }

    public async execute(msg: Message, _data: EventData): Promise<void> {
        await msg.reply("慢走不送，下次見面我希望有禮物給我！");
    }
}
