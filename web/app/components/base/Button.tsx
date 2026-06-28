import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './styling/Button.module.css';

// Define the interface to accept standard button props + optional custom Text
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    Text?: string;
    children?: ReactNode;
    className?: string; // Allow passing additional class names
}

function Button({ Text, children, className, ...ButtonProps }: ButtonProps) {
    return (
        <button {...ButtonProps} className={`${styles.btnPrimary} px-1 py-1 bg-neutral-secondary-soft text-heading rounded-base hover:bg-neutral-tertiary focus:outline-none  ${className || ''}`}>
           {children || Text}
        </button>
    );
}

export default Button;