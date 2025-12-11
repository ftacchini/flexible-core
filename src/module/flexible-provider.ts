import { FlexibleContainer } from "../container/flexible-container";

export interface FlexibleProvider<T> {
    getInstance(container: FlexibleContainer): T;
}