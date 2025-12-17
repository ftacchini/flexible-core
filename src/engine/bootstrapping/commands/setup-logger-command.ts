import { FlexibleAppState } from "../../app/app-state";
import { FlexibleLogger } from "../../../extension-points/logging/logger.interface";
import { injectable, inject } from "tsyringe";
import { FLEXIBLE_APP_TYPES } from "../../app/app-types";

@injectable()
export class SetupLoggerCommand {

    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {
    }

    public execute(app: FlexibleAppState) {
        this.logger.debug("Setting up logger...");
        app.logger = this.logger;
        this.logger.debug("Logger setup done\n");
    }

}
