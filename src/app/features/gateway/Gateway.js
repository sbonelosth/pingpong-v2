import { useRef, useState } from "react";

const Gateway = ({ roomData, setRoomData, setJoinSuccess, socket }) => {
    const [isJoin, setIsJoin] = useState(true);
    const loginBtnRef = useRef(null);

    const handleChange = async (e) => {
        setRoomData({ ...roomData, [e.target.name]: e.target.value });

        if (e.target.name === "roomName") {
            try {
                const response = await fetch('https://pingpong-v2-server.onrender.com/validate', {
                    method: 'POST',
                    body: JSON.stringify({ roomName: e.target.value }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setIsJoin(data.exists);
                }
                else {
                    console.log(data.error);
                }

            }
            catch (error) {
                console.log("Error:", error);
            }
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();

        const hasNullValues = Object.values(roomData).some(value => value === null || value === '');

        if (hasNullValues) {
            // console.log('Missing some data. All data fields are required.');
            return;
        } else {
            // console.log('All the required data provided.');
            try {
                const res = await fetch('https://pingpong-v2-server.onrender.com/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(roomData)
                });
                const data = await res.json();
                if (res.ok) {
                    socket.emit("join-room", roomData);
                    setJoinSuccess(true);
                    localStorage.setItem("roomData", JSON.stringify(roomData));
                    localStorage.setItem("refreshToken", data.refreshToken);
                    localStorage.setItem("accessToken", data.accessToken);
                    console.log("Joined successfully: ", data);
                } else {
                    console.log("Error: ", data.error);
                }
            } catch (err) {
                console.log("Error: ", err);
            }
        }
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
                required
                placeholder="username" />
            <button id="proceed-btn" ref={loginBtnRef} onClick={handleJoinRoom}>{`${isJoin ? "Join" : "Create"} Room`}</button>
        </section>
    );
};

export default Gateway;
