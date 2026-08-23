
import { useEffect, useState } from 'react';
import gridStyles from './styling/Grid.module.css';

export interface Item {
    id: number;
    name: string;
    category: string;
    quantity: number;
    price: number;
}

function ItemElement(item: Item, addToCart: (item: Item) => void) {

    const style: React.CSSProperties = {
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
    };

    return (
        <div style={style}  onClick={() => addToCart(item)} key={item.id}>
            <h3 id='name'>{item.name}</h3>
            <div className='text-xs flex gap-4'>
                <div>
                    <span id='quantity'>Quantity: <br/>{item.quantity}</span>
                </div>
                <div>
                    <span id='price'>Price: <br/> ${item.price.toFixed(2)}</span>
                </div>
            </div>

        </div>
    );
}

function CategoryTabs({ Categories, activeCategory, setActiveCategory }: { Categories: string[], activeCategory: string, setActiveCategory: (category: string) => void }) {

    return (
        <div>
            <ul className="flex flex-wrap text-sm font-medium text-center *:border *:border-solid *:border-neutral-300 *:rounded-t-lg *:bg-amber-100 text-body" data-tabs-toggle="#default-styled-tab-content" role="tablist">
                {Categories.map((category) => {
                    const categorySlug = String(category).toLowerCase().replace(/\s+/g, '-' + Math.random().toString(36).substring(2, 7)); // Ensure unique ID for each category

                    return (
                        <li className="me-2 has-active:bg-green-100" role="presentation" key={categorySlug}>
                            <button
                                type="button"
                                className={`inline-block px-4 py-3 rounded-base hover:text-heading hover:bg-neutral-secondary-soft first:active ${activeCategory === category ? 'bg-neutral-secondary-soft text-heading' : ''}`}
                                id={`${categorySlug}-tab`}
                                role="tab"
                                aria-controls={categorySlug}
                                aria-selected={activeCategory === category}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>

    );
}

function CategoryPanel({ items, categories, activeCategory, addToCart }: { items: Item[], categories: { id: string, name: string }[], activeCategory: string, addToCart: (item: Item) => void }) {

    const style: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
        gridAutoFlow: 'row',
        gridAutoRows: 'minmax(100px, auto)',
        gap: '16px',
    };

    return (
        <div className="mt-4" >
            {categories.map(category => {
                const categorySlug = String(category.name).toLowerCase().replace(/\s+/g, '-'+ Math.random().toString(36).substring(2, 7)); // Ensure unique ID for each category

                return (
                        <div  key={category.id} id={categorySlug} role="tabpanel" style={style} aria-labelledby={`${categorySlug}-tab`} className={activeCategory === category.id ? '' : 'hidden' + ' grid-cols-5 gap-4 auto-rows-[minmax(100px,auto)]' } >

                            {items.filter(item => item.category === category.id).map(item => ItemElement(item, addToCart))}

                    </div>
                );
            })}
        </div>
    );
}

function ItemsAvailable({ items, addToCart }: { items: Item[], addToCart: (item: Item) => void }) {

    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [activeCategory, setActiveCategory] = useState('');

    useEffect(() => {
        fetch("http://localhost:3000/categories/")
            .then(res => res.json())
            .then((data: { id: string, name: string }[]) => setCategories(data.map(category => {return {id: category.id, name: category.name}})));
    }, []);

    useEffect(() => {
        if (categories.length > 0 && !categories.some(category => category.id === activeCategory)) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    return (
        <div className={`items-available ${gridStyles.mainView}`} id='items-available'>
            <CategoryTabs Categories={categories.map(c => c.name)} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            <CategoryPanel items={items} categories={categories} activeCategory={activeCategory} addToCart={addToCart} />
        </div>
    );
}

export default ItemsAvailable;