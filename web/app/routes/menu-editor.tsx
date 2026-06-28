import react from "react";
import Button from "~/components/base/Button";
import styles from '~/components/styling/Grid.module.css';
import { Grid } from "~/components/grid";
import ClickableList from "~/components/base/clickable-list";

export default function MenuEditor() {

    interface ItemForm {
        name: string;
        price: number;
    }

    const [editingField, setEditingField] = react.useState<ItemForm | null>(null);

    function getMenuItems() {
        return [
            { id: 1, name: 'Burger', price: 5.99 },
            { id: 2, name: 'Fries', price: 2.99 },
            { id: 3, name: 'Soda', price: 1.99 },
        ];
    }

    function modifyMenuItem(itemId: number) {
        const item = getMenuItems().find(item => item.id === itemId);
        if (item) {
            setEditingField({ name: item.name, price: item.price } as ItemForm);
        } else {
            console.error(`Item with id ${itemId} not found`);
        }

    }

    function MenuList() {
        const menuItems = getMenuItems();
        return (
            <ClickableList interact={index => modifyMenuItem(menuItems[index].id)}>
                {menuItems.map(item => (
                    <div key={item.id}>
                        <span>{item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                    </div>
                ))}
            </ClickableList>
        );
    }

    function ActionButtons() {
        return (
            <div className={` ${styles.sideActions} grid grid-cols-2 grid-rows-3 gap-2 max-h-100 `} id='side-actions'>
                <Button className="bg-blue-500 text-white px-4 py-2 rounded">Add Item</Button>
                <Button className="bg-yellow-500 text-white px-4 py-2 rounded">Edit Item</Button>
                <Button className="bg-red-500 text-white px-4 py-2 rounded">Delete Item</Button>
                <Button className="bg-green-500 text-white px-4 py-2 rounded">Save Menu</Button>
            </div>
        );
    }

    function ItemEditForm() {
        return (
            <div className={`p-4 border rounded ${styles.mainView}`}>
                <h2 className="text-2xl font-bold mb-4">Edit Menu Item</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block mb-1">Name</label>
                        <input type="text" className="w-full p-2 border rounded" value={editingField?.name || ''} onChange={(e) => setEditingField({ ...editingField, name: e.target.value } as ItemForm)} />
                    </div>
                    <div>
                        <label className="block mb-1">Price</label>
                        <input type="number" step="0.01" className="w-full p-2 border rounded" value={editingField?.price || ''} onChange={(e) => setEditingField({ ...editingField, price: parseFloat(e.target.value) || 0 } as ItemForm)} />
                    </div>
                    <Button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Save Changes</Button>
                </form>
            </div>
        );
    }

    return (
        <Grid>
            <MenuList />
            <ActionButtons />
            <ItemEditForm />
        </Grid>
    );
}