export interface FlexibleActivationContext { 
    activate(...params: any[]): Promise<any>;
}