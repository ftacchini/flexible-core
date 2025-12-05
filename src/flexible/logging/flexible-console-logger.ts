import { FlexibleLogger, LogContext } from "../../logging/flexible-logger";
import { injectable, inject } from "inversify";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";

@injectable()
export class FlexibleConsoleLogger implements FlexibleLogger {

    public static readonly TYPE: symbol = Symbol("FlexibleConsoleLogger");

    private static EMERGENCY_PREFIX: string = "EMERGENCY";
    private static ALERT_PREFIX: string = "ALERT";
    private static CRITICAL_PREFIX: string = "CRITICAL";
    private static ERROR_PREFIX: string = "ERROR";
    private static WARNING_PREFIX: string = "WARNING";
    private static NOTICE_PREFIX: string = "NOTICE";
    private static INFO_PREFIX: string = "INFO";
    private static DEBUG_PREFIX: string = "DEBUG";
    private static SEPARATOR: string = ": ";

    constructor(@inject(FLEXIBLE_LOGGER_TYPES.CONSOLE) private consoleInstance: Console = console) {
    }


    private logToConsole(prefix: string, message: string, context?: LogContext): void {
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        this.consoleInstance.log(prefix + FlexibleConsoleLogger.SEPARATOR + message + contextStr);
    }

    public emergency(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.EMERGENCY_PREFIX, message, context);
    }
    public alert(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.ALERT_PREFIX, message, context);
    }
    public crit(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.CRITICAL_PREFIX, message, context);
    }
    public error(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.ERROR_PREFIX, message, context);
    }
    public warning(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.WARNING_PREFIX, message, context);
    }
    public notice(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.NOTICE_PREFIX, message, context);
    }
    public info(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.INFO_PREFIX, message, context);
    }
    public debug(message: string, context?: LogContext): void {
        this.logToConsole(FlexibleConsoleLogger.DEBUG_PREFIX, message, context);
    }
}