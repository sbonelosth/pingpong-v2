import { useRef, useState } from "react";

const Gateway = ({ roomData, setRoomData, setJoinSuccess, setIsLoading, socket }) =>
{
    const [isJoin, setIsJoin] = useState(true);
    const loginBtnRef = useRef(null);
    const usernameRef = useRef(null);

    const handleChange = async (e) =>
    {
        setRoomData({ ...roomData, [e.target.name]: e.target.value });

        if (e.target.name === "roomName")
        {
            try
            {
                const response = await fetch('https://pingpong-v2-server.onrender.com/found', {
                    method: 'POST',
                    body: JSON.stringify({ roomName: e.target.value }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();
                if (response.ok)
                {
                    setIsJoin(data.exists);
                }
                else
                {
                    console.log(data.error);
                }

            }
            catch (error)
            {
                console.log("Error:", error);
            }
        }
    };

    const handleJoinRoom = async (e) =>
    {
        e.preventDefault();

        setIsLoading(true);

        const hasNullValues = Object.values(roomData).some(value => value === null || value === '');

        if (hasNullValues)
        {
            return;
        } else
        {
            try
            {
                const res = await fetch('https://pingpong-v2-server.onrender.com/room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(roomData)
                });
                const data = await res.json();
                if (res.ok)
                {
                    socket.emit("join-room", roomData);
                    setIsLoading(false);
                    setJoinSuccess(true);
                    localStorage.setItem("roomData", JSON.stringify(roomData));
                    localStorage.setItem("refreshToken", data.refreshToken);
                    localStorage.setItem("accessToken", data.accessToken);

                } else
                {
                    console.log("Error: ", data.error);
                }
            } catch (err)
            {
                console.log("Error: ", err);
            }
        }
    };

    const handleOpenRoom = () => {
        setRoomData({
            roomName: "freeroom",
            roomKey: "1234",
            username: "",
        });

        usernameRef.current.focus();
    };

    return (
        <section className="gateway-container">
            <p style={{ fontWeight: "bold", color: "aliceblue" }}>Join the Chat</p>
            <input
                type="text"
                value={roomData.roomName}
                name="roomName"
                onChange={handleChange}
                required
                placeholder="room name" />
            <input
                type="text"
                name="roomKey"
                value={roomData.roomKey}
                onChange={handleChange}
                required
                placeholder="room key" />
            <input
                type="text"
                name="username"
                value={roomData.username}
                onChange={handleChange}
                ref={usernameRef}
                required
                placeholder="username" />
            <button
                id="proceed-btn"
                ref={loginBtnRef}
                onClick={handleJoinRoom}>
                {`${isJoin ? "Join" : "Create"} Room`}
            </button>
            <p className="existing-room">
                <button onClick={handleOpenRoom}>Click here</button>{" to access an existing room"}
            </p>
        </section>
    );
};

export default Gateway;
