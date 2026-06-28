import React, { useState } from 'react';
import Button from './base/Button';

function Navbar({ isOpen, menuId }: { isOpen: boolean; menuId: string }) {
  return (
    <div className={`${isOpen ? 'block' : 'hidden'} h-screen border-r-amber-600 rounded-r-lg absolute left-0 top-full bg-amber-950 z-10 w-full`} id={menuId}>
      <ul className='flex flex-col font-medium mt-4 pt-4  bg-inherit'>
        <li>
          <a href='#' className='block py-2 px-3 text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0' aria-current='page'>Home</a>
        </li>
        <li>
          <a href='/menu-editor' className='block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent'>Menu Editor</a>
        </li>
        <li>
          <a href='#' className='block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent'>Pricing</a>
        </li>
        <li>
          <a href='#' className='block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent'>Contact</a>
        </li>
      </ul>
    </div>
  );
}

function TopbarLeft() {
  const [isOpen, setIsOpen] = useState(false);

  const menuId = 'navbar-hamburger';

  return (
    <div className='topbar-left'>
      <nav className='bg-neutral-secondary-soft w-full top-0 start-0'>
        <div className='relative max-w-xl flex flex-wrap items-center justify-between mx-auto bg-transparent'>
          <button
            type='button'
            onClick={() => {setIsOpen(previous => !previous);
}}
            className='inline-flex items-center w-10 h-10 justify-center text-sm text-body rounded-base hover:bg-neutral-tertiary hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary'
            aria-controls={menuId}
            aria-expanded={isOpen}
          >

            <span className='sr-only'>Open main menu</span>
            <svg className='w-6 h-6' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' strokeLinecap='round' strokeWidth='2' d='M5 7h14M5 12h14M5 17h14' /></svg>
          </button>
          <Navbar isOpen={isOpen} menuId={menuId} />
        </div>
      </nav>

    </div>
  );
}

function TopbarCenter() {
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {clearInterval(timer);
};
  }, []);

  return (
    <div className='topbar-center'>
      {/* Clock in topbar with updating time */}
      <div className='clock p-2 text-center text-heading font-medium'>
        {time.toLocaleTimeString()}
      </div>
    </div>
  );
}

function TopbarRight() {
  return (
    <div className='topbar-right'>
      {/* Logout and user icon */}
      <div className='user-actions flex items-center justify-end gap-4'>
        <Button className='logout-btn text-heading hover:text-fg-brand'>Logout</Button>
        <div className='user-icon w-8 h-8 rounded-full bg-neutral-secondary-soft flex items-center justify-center text-heading'>
          <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-4 h-4'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21c-2.676 0-5.216-.584-7.499-1.882z' />
          </svg>
        </div>
      </div>

    </div>
  );
}

export default function Topbar() {
  return (
    <div className='topbar flex  w-full'>
      <div className='flex-1'>
        <TopbarLeft />
      </div>
      <div className='flex-1'>
        <TopbarCenter />
      </div>
      <div className='flex-1'>
        <TopbarRight />
      </div>
    </div>
  );
}
