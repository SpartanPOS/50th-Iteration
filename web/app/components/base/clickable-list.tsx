import React from "react";
// import gridstyle from '~/components/styling/Grid.module.css';
import styles from '~/components/base/styling/clickable-list.module.css';

interface ClickableListProps {
    children: React.ReactNode;
    itemActionButtons?: React.ReactNode;
    interact?: (objectIndex: number) => void;
    onActiveChange?: (objectIndex: number | null) => void;
}

export default function ClickableList({ children, itemActionButtons, interact, onActiveChange }: ClickableListProps) {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    const listItems = React.Children.toArray(children);

    function clearActiveIndex() {
        setActiveIndex(null);
        onActiveChange?.(null);
    }

    function handleInteract(objectIndex: number) {
        interact?.(objectIndex);

        setActiveIndex(currentActiveIndex => {
            const nextActiveIndex = currentActiveIndex === objectIndex ? null : objectIndex;
            onActiveChange?.(nextActiveIndex);
            return nextActiveIndex;
        });
    }

    return (
        <div className="border-radius-10">
            <div className={styles.sideList} id='sidecart'>
                {itemActionButtons ? (
                    <div className={styles.itemModButtons} onClickCapture={clearActiveIndex}>
                        {itemActionButtons}
                    </div>
                ) : null}

                {listItems.map((child, index) => (
                    <div
                        key={index}
                        className={`${styles.listItem} ${index === activeIndex ? styles.active : ''}`}
                        onClick={() => handleInteract(index)}
                    >
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}