export interface BaseModel<T = any> {
    toEntityData(): Record<string, any>;
    save(): Promise<T>;
}
