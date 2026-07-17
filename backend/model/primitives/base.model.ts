export interface BaseModel<T = any> {
    toEntityData(): Record<string, any>;
    getAll(): Promise<T[]> | T[];
    save(): Promise<T>;
    getByID(id: string): Promise<T | null>;
    getByName(name: string): Promise<T | null>;
}
