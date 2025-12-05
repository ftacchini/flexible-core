import { inject, injectable } from "inversify";
import { FlexibleLogger, LogContext } from "../../logging";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";

@injectable()
export class FlexibleLoggerProxy implements FlexibleLogger {

    constructor (@inject(FLEXIBLE_LOGGER_TYPES.LOGGER_PROVIDER) private loggerProvider: () => FlexibleLogger) {
        console.log("loggerProvider is " + loggerProvider)
    }

    private logUsingLogger(message: string, method: keyof FlexibleLogger, context?: LogContext) {
        this.loggerProvider()[method](message, context);
    }

    public emergency(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "emergency", context);
    }
    public alert(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "alert", context);
    }
    public crit(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "crit", context);
    }
    public error(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "error", context);
    }
    public warning(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "warning", context);
    }
    public notice(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "notice", context);
    }
    public info(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "info", context);
    }
    public debug(message: string, context?: LogContext): void {
        this.logUsingLogger(message, "debug", context);
    }
}