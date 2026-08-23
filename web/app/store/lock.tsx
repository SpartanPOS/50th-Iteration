import { useState, useEffect, useRef } from 'react';

function LockScreen() {
    const [isLocked, setIsLocked] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const INACTIVITY_MS = 5 * 60 * 1000;

    useEffect(() => {
        const resetInactivityTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                setIsLocked(true);
            }, INACTIVITY_MS);

            const activityEvents: Array<keyof WindowEventMap> = [
                "mousemove",
                "mousedown",
                "keydown",
                "touchstart",
                "scroll",
            ];

            activityEvents.forEach((eventName) => {
                window.addEventListener(eventName, resetInactivityTimer, { passive: true });
            });

            // Start timer immediately
            resetInactivityTimer();

            return () => {
                activityEvents.forEach((eventName) => {
                    window.removeEventListener(eventName, resetInactivityTimer);
                });

                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
            };
        };
    }, []);

    const handleUnlock = () => {
        fetch('http://localhost:3000/users/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, password: password, auth_level: 1 }),
        }).then(response => {
            if (response.ok) {
                response.json().then(data => {
                    setToken(data.token);
                    fetch('http://localhost:3000/users/test', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${data.token}`,
                        },
                    }).then(res => {
                        if (res.ok) {
                            setIsLocked(false);
                            localStorage.setItem('token', data.token);
                        }
                    });
                });
            } else {
                response.json().then(data => {
                    setError(data.error);
                });
            }
        });
    }


    return (
        <>
            {isLocked && (
                <div className="lock-screen">
                    <h2>Session Locked</h2>
                    <p>Please enter your credentials to unlock.</p>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleUnlock}>Unlock</button>
                    {error && <p className="error">{error}</p>}
                </div>
            )}
        </>
    )

}

export default LockScreen;