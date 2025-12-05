import { FlexibleLogger, LogContext } from "../../logging/flexible-logger";
import { injectable } from "inversify";

@injectable()
export class FlexibleSilentLogger implements FlexibleLogger {

    public static readonly TYPE: symbol = Symbol("FlexibleSilentLogger");

    public emergency(message: string, context?: LogContext): void {}
    public alert(message: string, context?: LogContext): void {}
    public crit(message: string, context?: LogContext): void {}
    public error(message: string, context?: LogContext): void {}
    public warning(message: string, context?: LogContext): void {}
    public notice(message: string, context?: LogContext): void {}
    public info(message: string, context?: LogContext): void {}
    public debug(message: string, context?: LogContext): void {}
}