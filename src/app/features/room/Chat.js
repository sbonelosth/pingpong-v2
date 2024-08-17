import React, { useEffect, useRef, useState } from 'react';
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faPaperPlane, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { handleImageChange } from '../../utils/imageUtils';

const Chat = ({ socket, userData, handleLogout }) => {
    const [currentMsg, setCurrentMsg] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [timer, setTimer] = useState(null);
    const [alertSuffix, setAlertSuffix] = useState("");
    const [messageCount, setMessageCount] = useState(0);
    const [imageObject, setImageObject] = useState({
        file: null,
        blob: "",
        type: ""
    });
    const [projectedImage, setProjectedImage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingMsg, setTypingMsg] = useState("");
    let previousSender = null;
    const chatContainerRef = useRef(null);

    const handleImageClick = (imageSrc) => {
        setProjectedImage(imageSrc);
    };

    const closeProjectedImage = () => {
        setProjectedImage(null);
    };


    const handleCurrentMsg = (e) => {
        setCurrentMsg(e.target.value);
    };

    const onImageChange = (e) => {
        const file = e.target.files[0];
        handleImageChange(file, setImageObject);
    }

    const handleImageUndo = () => {
        setImageObject({
            file: null,
            blob: "",
            type: ""
        });
    };

    const handleTyping = async () => {
        await socket.emit("user-typing", userData);
    };

    const sendMsg = async (e) => {
        e.preventDefault();

        if (currentMsg !== "") {
            setMessageCount(prevCount => prevCount + 1);

            const messageContent = {
                room: userData.roomName,
                sender: userData.username,
                message: currentMsg,
                timestamp: moment().format("LT"),
                blob: imageObject.blob,
                mimeType: imageObject.type,
                count: messageCount + 1
            };

            await socket.emit("send-message", messageContent);
            setMessageList((list) => [...list, messageContent]);
            setCurrentMsg("");

            setImageObject({
                file: null,
                blob: "",
                type: ""
            });
        }
    };

    const handleUserJoin = (user) => {
        clearTimeout(timer);
        setUserList((prevUsers) => [...prevUsers, user]);

        const newTimer = setTimeout(() => {
            setUserList([]);
        }, 3000);

        setTimer(newTimer);
    };

    useEffect(() => {
        socket.on("receive-message", (messageContent) => {
            setIsTyping(false);
            setMessageList((list) => [...list, messageContent]);
        });

        socket.on("join-alert", (data) => {
            setAlertSuffix("joined");
            handleUserJoin(data.username);
        });

        socket.on("user-typing", (msg) => {
            setIsTyping(true);
            setTypingMsg(msg);
        });

        socket.on("left-alert", (data) => {
            handleUserJoin(data.username);
            setAlertSuffix("left");
        });

        return () => {
            socket.off("receive-message");
            socket.off("join-alert");
            socket.off("user-typing");
            socket.off("left-alert");
        };

    }, [socket]);

    useEffect(() => {
        if (isTyping) {
            const typingTimeout = setTimeout(() => {
                setIsTyping(false);
            }, 1000);

            return () => clearTimeout(typingTimeout);
        }
    }, [isTyping]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messageList]);

    useEffect(() => {
        return () => clearTimeout(timer);
    }, [timer]);

    return (
        <section className="room-container">
            <div className="action-bar">
                <div className="room-name">{userData.roomName} : {isTyping ? ` ${typingMsg}` : userData.username}</div>
                <button className="exit-room" id="exit-room" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} size='2x' color='#d1c994' />
                </button>
            </div>
            <div className={`join-alert-container ${userList.length > 0 ? "show=alert" : "hide-alert"}`}>
                {userList.length > 0 && (
                    <span style={{ color: 'aliceblue' }}>
                        {userList.length === 1
                            ? `${userList[0]} ${alertSuffix}`
                            : `${userList.slice(0, -1).join(', ')} and ${userList.slice(-1)} ${alertSuffix}`}
                    </span>
                )}
            </div>
            <div className="chat-container" ref={chatContainerRef}>
                {
                    messageList.map((messageContent, index) => {
                        const showUserMeta = previousSender !== messageContent.sender;
                        previousSender = messageContent.sender;

                        return (
                            <div className={`message-container ${userData.username === messageContent.sender ? "sender" : "other"}`} key={index}>
                                <div className="message-content">
                                    {showUserMeta && (
                                        <div className='user-meta'>
                                            <p className='sender-name'>{messageContent.sender}</p>
                                            <p className='timestamp'>{` at ${messageContent.timestamp}`}</p>
                                        </div>
                                    )}
                                    <p className={`text-message ${showUserMeta ? "margin" : "no-margin"}`}>{messageContent.message}</p>
                                    {messageContent.blob && (
                                        <img
                                            src={`data:image/${messageContent.mimeType};base64,${messageContent.blob}`}
                                            width="100"
                                            alt="Uploaded"
                                            onClick={() => handleImageClick(`data:image/${messageContent.mimeType};base64,${messageContent.blob}`)} />
                                    )}
                                    {projectedImage && (
                                        <div className="projected-image-container" onClick={closeProjectedImage}>
                                            <img src={projectedImage} alt="Projected" className="projected-image" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                }
            </div>
            <div
                className="input-container"
                style={{
                    width: "100%"
                }}>
                <div
                    onClick={handleImageUndo}
                    className="attachment-preview"
                    style={{
                        width: "100px",
                        borderRadius: "10px",
                    }}>
                    {
                        (imageObject.file !== null) &&
                        <img style={{ width: "100px", borderRadius: "10px", margin: "1rem" }}
                            src={`data:image/${imageObject.type};base64,${imageObject.blob}`} alt='Preview' />
                    }
                </div>
                <div className="input-content">
                    <label className="attach-file">
                        <input
                            type="file"
                            id="image-upload"
                            name="imageUpload"
                            onChange={onImageChange}
                            accept=".jpg, .jpeg, .png" />
                        <FontAwesomeIcon icon={faImage} color='#d1c994' />
                    </label>
                    <input
                        type="text"
                        value={currentMsg}
                        onChange={handleCurrentMsg}
                        onKeyUp={handleTyping}
                        onKeyDown={e => { e.key === "Enter" && sendMsg(e) }}
                        id="input-text"
                        placeholder="Message"
                        required />
                    <button
                        className="btn"
                        onClick={sendMsg}
                        id="send-btn">
                        <FontAwesomeIcon icon={faPaperPlane} color='#000' />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Chat
