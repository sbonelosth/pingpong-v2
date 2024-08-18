import './App.css';
import "@fontsource/jetbrains-mono";
import Chat from './app/features/room/Chat';
import { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';
import Public from './app/features/room/Public';
import useScrollSnap from 'react-use-scroll-snap';
import Gateway from './app/features/gateway/Gateway';

const socket = io.connect("https://pingpong-v2-server.onrender.com");

const App = () =>
{
    const [roomData, setRoomData] = useState({
        roomName: "",
        roomKey: "",
        username: "",
    });

    const storedRoomData = JSON.parse(localStorage.getItem('roomData'));

    const [joinSuccess, setJoinSuccess] = useState(false);

    const [accessToken, setAccessToken] = useState(null);

    const fetchWithToken = async (url, options = {}) =>
    {
        let token = accessToken;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 403)
        {
            const refreshToken = localStorage.getItem('refreshToken');
            const refreshResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: refreshToken })
            });

            if (refreshResponse.ok)
            {
                const refreshData = await refreshResponse.json();
                setAccessToken(refreshData.accessToken);

                localStorage.setItem('accessToken', refreshData.accessToken);
                token = refreshData.accessToken;

                return fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${token}`
                    }
                });

            } else
            {
                handleLogout();
            }
        }

        return response;
    };


    const handleLogout = () =>
    {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        window.location.href = '/';
    };

    const verifyToken = async (token) =>
    {
        const response = await fetchWithToken('https://pingpong-v2-server.onrender.com/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (response.ok)
        {
            const data = await response.json();
            setAccessToken(data.accessToken);
            localStorage.setItem('accessToken', data.accessToken);
            setJoinSuccess(true);
        } else
        {
            console.log("Token verification failed");
        }
    };

    useEffect(() =>
    {
        const token = localStorage.getItem('refreshToken');
        if (token)
        {
            verifyToken(token);
            setRoomData({
                roomName: storedRoomData.roomName,
                roomKey: storedRoomData.roomKey,
                username: storedRoomData.username,
            });
            console.log("Stored refresh token:", token, "\nroomData after refresh:", roomData);
            socket.emit("join-room", storedRoomData);
        }
    }, []);


    const scrollRef = useRef(null);
    useScrollSnap({ ref: scrollRef, duration: 10, delay: 0 });

    return (
        <section className="App">
            {
                !joinSuccess ? (
                    <Gateway
                        roomData={roomData}
                        setRoomData={setRoomData}
                        setJoinSuccess={setJoinSuccess}
                        socket={socket}
                    />
                ) : (
                    <main className='main-activity' ref={scrollRef}>
                        <Chat socket={socket} userData={storedRoomData} handleLogout={handleLogout} />
                        <Public socket={socket} userData={storedRoomData} />
                    </main>
                )
            }
        </section>
    );
}

export default App;