import { FlexibleLogger, LogContext, LogLevel } from "../../logging/flexible-logger";
import { LoggerConfig } from "../../logging/logger-config";
import { injectable, inject } from "inversify";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import * as os from "os";

@injectable()
export class FlexibleConfigurableLogger implements FlexibleLogger {

    public static readonly TYPE: symbol = Symbol("FlexibleConfigurableLogger");

    private hostname: string;

    constructor(
        @inject(FLEXIBLE_LOGGER_TYPES.CONFIG) private config: LoggerConfig,
        @inject(FLEXIBLE_LOGGER_TYPES.CONSOLE) private consoleInstance: Console = console
    ) {
        this.hostname = os.hostname();
    }

    private shouldLog(level: LogLevel): boolean {
        // Check if level is enabled
        if (level > this.config.minLevel) {
            return false;
        }

        // Check sampling
        if (this.config.sampling && this.config.sampling.levels?.includes(level)) {
            return Math.random() < this.config.sampling.rate;
        }

        return true;
    }

    private logStructured(level: LogLevel, message: string, context?: LogContext): void {
        if (!this.shouldLog(level)) {
            return;
        }

        if (this.config.format === 'json') {
            const logEntry: any = {
                level: LogLevel[level],
                message,
                ...context
            };

            if (this.config.includeTimestamp) {
                logEntry.timestamp = new Date().toISOString();
            }

            if (this.config.includeHostname) {
                logEntry.hostname = this.hostname;
            }

            this.consoleInstance.log(JSON.stringify(logEntry));
        } else {
            // Text format
            const prefix = LogLevel[level];
            const contextStr = context ? ` ${JSON.stringify(context)}` : '';
            const timestamp = this.config.includeTimestamp ? `[${new Date().toISOString()}] ` : '';
            this.consoleInstance.log(`${timestamp}${prefix}: ${message}${contextStr}`);
        }
    }

    public emergency(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.EMERGENCY, message, context);
    }

    public alert(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.ALERT, message, context);
    }

    public crit(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.CRITICAL, message, context);
    }

    public error(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.ERROR, message, context);
    }

    public warning(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.WARNING, message, context);
    }

    public notice(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.NOTICE, message, context);
    }

    public info(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.INFO, message, context);
    }

    public debug(message: string, context?: LogContext): void {
        this.logStructured(LogLevel.DEBUG, message, context);
    }
}
