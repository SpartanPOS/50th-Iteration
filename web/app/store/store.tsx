import { useEffect, useState } from 'react';
import ItemsAvailable from '../components/items-available';
import type { Item } from '../components/items-available';
import SideActions from '../components/side-actions';
import SideCart from '../components/side-cart';
import styles from './styling/store.module.css';
import { Grid } from '~/components/grid';
import LockScreen from './lock';

function Store() {
	const [CartItems, setCartItems] = useState<Item[]>([]);
	const [sampleItems, setSampleItems] = useState<Item[]>([]);

	useEffect(() => {
		fetch('http://localhost:3000/items')
			.then(response => response.json())
			.then(items => setSampleItems(items as Item[]));
	}, []);

	function addToCart(item: Item) {
		console.log(`Added to cart: ${item.name}`);
		setCartItems(previousItems => {
			if (previousItems.find(i => i.id === item.id)) {
				// If item already in cart, increase quantity
				return previousItems.map(i =>
					i.id === item.id ? {...i, quantity: i.quantity + item.quantity} : i);
			}

			// Else add new item to cart
			return [...previousItems, {...item, quantity: item.quantity}];
		});
	}

	function updateQuantity(id: number, delta: number) {
		setCartItems(previousItems => previousItems.map(item => {
			if (item.id === id) {
				const newQuantity = item.quantity + delta;
				if (newQuantity <= 0) {
					return null;
				} // Logic to handle removal if routed here, or just prevent < 1

				return {...item, quantity: newQuantity} as Item;
			}

			return item;
		}).filter((item): item is Item => item !== null));
	}

	function removeItem(id: number) {
		setCartItems(previousItems => previousItems.filter(item => item.id !== id));
	}

	let mainContent = ItemsAvailable({ items: sampleItems, addToCart });

	return (
		<div id='top-container' className={styles.topMargin}>
			<Grid >
				<SideCart items={CartItems} updateQuantity={updateQuantity} removeItem={removeItem} />
				<SideActions handlePayNow={() => { console.log('Pay Now clicked'); }} />
				{
					mainContent
				}
				{/* <ItemsAvailable items={sampleItems} addToCart={addToCart} /> */}
			</Grid>
		</div>
	);
}

export { Store };
