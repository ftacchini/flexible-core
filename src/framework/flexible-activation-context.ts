export interface FlexibleActivationContext { 
    activate(contextBinnacle: { [key: string]: string }, ...params: any[]): Promise<any>;
}