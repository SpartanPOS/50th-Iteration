import React from 'react';
import Button from './base/Button';
import gridStyles from './styling/Grid.module.css';

function SideActions({ handlePayNow }: { handlePayNow: () => void }) {
  const actions = Array.from({ length: 4 }, (_, index) => ({
    id: index,
    label: `Action ${index + 1}`,
    action: () => console.log(`Action ${index + 1} clicked`),
  }));

  // const handlePayNow = async () => {
  //   const intent = await fetch('http://localhost:3000/tx/new', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       amount: 1000,
  //       currency: 'usd',
  //       payment_method_types: ['card_present'],
  //       capture_method: 'automatic',
  //       payment_method_options: {
  //         card_present: {
  //           capture_method: 'manual_preferred'
  //         }
  //       }
  //     }),
  //   });
  //   const intentData = await intent.json();
  //   console.log('Payment Intent created:', intentData);

  //   const processResponse = await fetch('http://localhost:3000/tx/process', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         payment_intent_id: intentData.data,
  //         reader_id: 'simulated-s700', // Replace with actual reader ID
  //       }),
  //   });
  //   const processData = await processResponse.json();
  //   console.log('Reader payment completed:', processData);
  // }

  return (
    <div className={`side-actions grid grid-cols-2 grid-rows-3 gap-2 max-h-100 ${gridStyles.sideActions}`} id='side-actions'>
      {actions.map(action => (
        <Button key={action.id} className='action-item' onClick={action.action}>
          {action.label}
        </Button>
      ))}

      <Button key='PayNow' onClick={handlePayNow} className='col-span-full'>
        Pay Now
      </Button>
    </div>
  );
}

export default SideActions;
