import React from 'react';
import Button from './base/Button';
import gridStyles from './styling/Grid.module.css';

function SideActions() {
  const actions = Array.from({ length: 4 }, (_, index) => ({
    id: index,
    label: `Action ${index + 1}`,
    action: () => console.log(`Action ${index + 1} clicked`),
  }));

  const handlePayNow = () => {
    return;
  }

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
