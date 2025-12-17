import { LogLevel } from "./logger.interface";

export interface LoggerConfig {
    minLevel: LogLevel;
    format: 'text' | 'json';
    includeTimestamp?: boolean;
    includeHostname?: boolean;
    sampling?: {
        rate: number;             // Sample rate (0-1)
        levels?: LogLevel[];      // Which levels to sample
    };
}
