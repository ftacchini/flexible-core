import { Container } from "inversify";

export interface FlexibleProvider<T> {
    getInstance(container: Container): T;
}