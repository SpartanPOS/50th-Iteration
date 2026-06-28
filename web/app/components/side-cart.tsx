import type { Item } from "./items-available";
import React from "react";
import styles from '~/components/SideCart.module.css';
import Button from "./base/Button";
import ClickableList from "./base/clickable-list";

interface SideCartProps {
    items: Item[];
    updateQuantity: (id: number, delta: number) => void;
    removeItem: (id: number) => void;
}

function SideCart({ items, updateQuantity, removeItem }: SideCartProps) {
    const [activeItemId, setActiveItemId] = React.useState<number | null>(null);

    const activeItem = items.find(item => item.id === activeItemId);

    const itemActionButtons = activeItem ? (
        <div className={styles.itemModButtons}>
            <Button onClick={() => updateQuantity(activeItem.id, 1)}>+</Button>
            <Button onClick={() => updateQuantity(activeItem.id, -1)}>-</Button>
            <Button onClick={() => {
                removeItem(activeItem.id);
                setActiveItemId(null);
            }}>Remove</Button>
        </div>
    ) : null;

    return (
        <ClickableList
            itemActionButtons={itemActionButtons}
            interact={index => {
                const clickedItem = items[index];
                if (clickedItem) {
                    console.log(`Interacted with item: ${clickedItem.name}`);
                }
            }}
            onActiveChange={nextActiveIndex => {
                if (nextActiveIndex === null) {
                    setActiveItemId(null);
                    return;
                }

                setActiveItemId(items[nextActiveIndex]?.id ?? null);
            }}
        >
            {items.map(item => (
                <div key={item.id} id={`item-${item.id}`}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span>Quantity: {item.quantity}</span>
                    <span>Price: ${item.price.toFixed(2)}</span>
                </div>
            ))}
        </ClickableList>
    );
}

export default SideCart;
