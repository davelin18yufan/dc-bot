import express, { Express } from "express";
import util from "node:util";

import { Controller } from "@/controllers/index.js";
import { checkAuth, handleError } from "@/middleware/index.js";
import { Logger } from "@/services/index.js";
import Config from "~/config/config.json";
import Logs from "~/lang/logs.json";

export class Api {
    private app: Express;

    constructor(public controllers: Controller[]) {
        this.app = express();
        this.app.use(express.json());
        this.setupControllers();
        this.app.use(handleError());
    }

    public async start(): Promise<void> {
        const listen = util.promisify(this.app.listen.bind(this.app));
        await listen(Config.api.port);
        Logger.info(Logs.info.apiStarted.replaceAll("{PORT}", Config.api.port.toString()));
    }

    private setupControllers(): void {
        for (const controller of this.controllers) {
            if (controller.authToken) {
                controller.router.use(checkAuth(controller.authToken));
            }
            controller.register();
            this.app.use(controller.path, controller.router);
        }
    }
}
