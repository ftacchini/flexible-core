export interface FlexibleLogger {
    emergency(log: String): void;
    alert(log: String): void;
    crit(log: String): void;
    error(log: String): void;
    warning(log: String): void;
    notice(log: String): void;
    info(log: String): void;
    debug(log: String): void;
}