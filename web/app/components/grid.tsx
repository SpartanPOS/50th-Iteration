import React from "react";
import styles from './styling/Grid.module.css';

export function Grid({ children,  }: { children: React.ReactNode; }) {

    return (
        <div className={styles.grid}>
            {children}
        </div>
    );
}