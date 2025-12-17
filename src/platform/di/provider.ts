import { FlexibleContainer } from "./container";

export interface FlexibleProvider<T> {
    getInstance(container: FlexibleContainer): T;
}
