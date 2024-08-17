import React, { useState, useEffect } from 'react';

const JoinAlert = ({ newUser, onDismiss }) => {
    const [joinedUsers, setJoinedUsers] = useState([]);
    const [timer, setTimer] = useState(null);

    useEffect(() => {
        // Clear the timer when the component unmounts
        return () => clearTimeout(timer);
    }, [timer]);

    const handleUserJoin = (user) => {
        // Clear any existing timer
        clearTimeout(timer);

        // Add the new user to the list
        setJoinedUsers((prevUsers) => [...prevUsers, user]);

        // Set a new timer to dismiss the alert after 3 seconds
        const newTimer = setTimeout(() => {
            setJoinedUsers([]);
            onDismiss();
        }, 3000);

        setTimer(newTimer);
    };

    return (
        <div className='join-alert-container'>
            {joinedUsers.length > 0 && (
                <span style={{ color: 'aliceblue' }}>
                    {joinedUsers.length === 1
                        ? `${joinedUsers[0]} joined`
                        : `${joinedUsers.slice(0, -1).join(', ')} and ${joinedUsers.slice(-1)} joined`}
                </span>
            )}
        </div>
    );
};