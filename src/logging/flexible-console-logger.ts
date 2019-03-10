import { FlexibleLogger } from "./flexible-logger";
import { unmanaged } from "inversify";

export class FlexibleConsoleLogger implements FlexibleLogger {
    private static EMERGENCY_PREFIX: string = "EMERGENCY";
    private static ALERT_PREFIX: string = "ALERT";
    private static CRITICAL_PREFIX: string = "CRITICAL";
    private static ERROR_PREFIX: string = "ERROR";
    private static WARNING_PREFIX: string = "WARNING";
    private static NOTICE_PREFIX: string = "NOTICE";
    private static INFO_PREFIX: string = "INFO";
    private static DEBUG_PREFIX: string = "DEBUG";
    private static SEPARATOR: string = ": ";

    constructor(@unmanaged() private consoleInstance: Console = console) {
    }

    
    private logToConsole(prefix: string, log: String): void {
        this.consoleInstance.log(prefix + FlexibleConsoleLogger.SEPARATOR + log);
    }

    public emergency(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.EMERGENCY_PREFIX, log);
    }
    public alert(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.ALERT_PREFIX, log);
    }
    public crit(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.CRITICAL_PREFIX, log);
    }
    public error(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.ERROR_PREFIX, log);
    }
    public warning(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.WARNING_PREFIX, log);
    }
    public notice(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.NOTICE_PREFIX, log);
    }
    public info(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.INFO_PREFIX, log);
    }
    public debug(log: String): void {
        this.logToConsole(FlexibleConsoleLogger.DEBUG_PREFIX, log);
    }
}