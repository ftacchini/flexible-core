import { inject, injectable } from "inversify";
import { FlexibleLogger } from "../../logging";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";

@injectable()
export class FlexibleLoggerProxy implements FlexibleLogger{

    constructor (@inject(FLEXIBLE_LOGGER_TYPES.LOGGER_PROVIDER) private loggerProvider: () => FlexibleLogger) {
        console.log("loggerProvider is " + loggerProvider)
    } 

    private logUsingLogger(log: String, method: keyof FlexibleLogger) {
        this.loggerProvider()[method](log);
    }

    public emergency(log: String): void {
        this.logUsingLogger(log, "emergency");
    }
    public alert(log: String): void {
        this.logUsingLogger(log, "alert");
    }
    public crit(log: String): void {
        this.logUsingLogger(log, "crit");
    }
    public error(log: String): void {
        this.logUsingLogger(log, "error");
    }
    public warning(log: String): void {
        this.logUsingLogger(log, "warning");
    }
    public notice(log: String): void {
        this.logUsingLogger(log, "notice");
    }
    public info(log: String): void {
        this.logUsingLogger(log, "info");
    }
    public debug(log: String): void {
        this.logUsingLogger(log, "debug");
    }
}