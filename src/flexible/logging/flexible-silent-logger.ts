import { FlexibleLogger } from "../../logging/flexible-logger";
import { injectable } from "inversify";

@injectable()
export class FlexibleSilentLogger implements FlexibleLogger {

    public static readonly TYPE: symbol = Symbol("FlexibleSilentLogger");
    
    public emergency(log: String): void {}
    public alert(log: String): void {}
    public crit(log: String): void {}
    public error(log: String): void {}
    public warning(log: String): void {}
    public notice(log: String): void {}
    public info(log: String): void {}
    public debug(log: String): void {}
}