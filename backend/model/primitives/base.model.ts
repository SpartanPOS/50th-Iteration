export interface BaseModel {
    toEntityData(): Record<string, any>;
    save(): Promise<this>;
    getByID(id: string): Promise<this | null>;
    getByName(name: string): Promise<this | null>;
}
