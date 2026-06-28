import type { IUser } from "./users.model";

export interface ITXItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: number;
}

export interface IActionLog {
    id: number;
    headerHash: string;
}

export interface ITX {
    id: number;
    assignedUser: IUser;
    storeId: string;
    total: number;
    items: ITXItem[];
    actionLog: IActionLog;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: IUser;
}
