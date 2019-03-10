export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface Type<T> extends Function { 
    new (...args: any[]): T; 
}
