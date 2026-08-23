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
	let [mainContent, setMainContent] = useState<React.ReactNode>(<ItemsAvailable items={sampleItems} addToCart={addToCart} />);

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




	function PayScreen() {

		return (
			<div className={styles.payScreen} id='pay-screen'>
				<h2>Payment Screen</h2>
				<p>Implement payment processing here.</p>
				<button onClick={() => {
					console.log('Payment processed');
				}}>Process Payment</button>
			</div>
		);
	}

	async function handlePayNow() {
		setMainContent(<PayScreen />);
		const intent = await fetch('http://localhost:3000/tx/new', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				amount: 1000,
				currency: 'usd',
				payment_method_types: ['card_present'],
				capture_method: 'automatic',
				payment_method_options: {
				card_present: {
					capture_method: 'manual_preferred'
				}
				}
			}),
			});
			const intentData = await intent.json();
			console.log('Payment Intent created:', intentData);

			await fetch('http://localhost:3000/tx/simulate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					payment_intent_id: intentData.data,
					card_number: '4242424242424242', // Replace with actual card number
					reader_id: intentData.reader_id, // Replace with actual reader ID
				}),
			});

			const processResponse = await fetch('http://localhost:3000/tx/process', {
				method: 'POST',
				headers: {
				'Content-Type': 'application/json',
				},
				body: JSON.stringify({
				payment_intent_id: intentData.data,
				reader_id: intentData.reader_id, // Replace with actual reader ID
				}),
			});

			const processData = await processResponse.json();

		
			console.log('Reader payment completed:', processData);
		
	}
		

	return (
		<div id='top-container'>
			<LockScreen />
			<Grid >
				<SideCart items={CartItems} updateQuantity={updateQuantity} removeItem={removeItem} />
				<SideActions handlePayNow={handlePayNow} />
				{
					mainContent
				}
				{/* <ItemsAvailable items={sampleItems} addToCart={addToCart} /> */}
			</Grid>
		</div>
	);
}

export { Store };
