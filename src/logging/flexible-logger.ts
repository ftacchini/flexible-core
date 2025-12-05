export enum LogLevel {
    EMERGENCY = 0,
    ALERT = 1,
    CRITICAL = 2,
    ERROR = 3,
    WARNING = 4,
    NOTICE = 5,
    INFO = 6,
    DEBUG = 7
}

export interface LogContext {
    [key: string]: any;
}

export interface FlexibleLogger {
    emergency(message: string, context?: LogContext): void;
    alert(message: string, context?: LogContext): void;
    crit(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    warning(message: string, context?: LogContext): void;
    notice(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}