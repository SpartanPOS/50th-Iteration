import type { IMenu } from "../menu.model";
import type { IUser } from "../users.model";
import type { Item } from "../item.model";
import type { IStore } from "../store.model";
import type { Category } from "../category.model";

export interface IDeviceConfig {
    users: Pick<IUser, "id" | "username" | "email">[];
    menus: IMenu[];
    categories: Category[];
    items: Item[];
    store: IStore; 
    deviceRole: "POS" | "KITCHEN" | "BAR" | "HOST" | "ADMIN";
}    