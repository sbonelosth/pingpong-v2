import { faHouseLock, faImage, faLock, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { handleImageChange } from '../../utils/imageUtils';

const Public = ({ socket, userData }) => {
    const [currentPost, setCurrentPost] = useState("");
    const [postList, setPostList] = useState([]);
    const [imageObject, setImageObject] = useState({
        file: null,
        blob: "",
        type: ""
    });

    const [projectedImage, setProjectedImage] = useState(null);

    let previousSender = null;
    const publicContainerRef = useRef(null);

    const handleImageClick = (imageSrc) => {
        setProjectedImage(imageSrc);
    };

    const closeProjectedImage = () => {
        setProjectedImage(null);
    };

    const handleCurrentPost = (e) => {
        setCurrentPost(e.target.value);
    };

    const onImageChange = (e) => {
        const file = e.target.files[0];
        handleImageChange(file, setImageObject);
    }

    const sendPost = async (e) => {
        e.preventDefault();

        if (currentPost !== "") {
            const postContent = {
                room: "public",
                sender: userData.username,
                post: currentPost,
                timestamp: moment().format("LT"),
                blob: imageObject.blob,
                mimeType: imageObject.type,
            };

            await socket.emit("send-post", postContent);
            setPostList((list) => [...list, postContent]);
            setCurrentPost("");

            setImageObject({
                file: null,
                blob: "",
                type: ""
            });
        }
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    useEffect(() => {
        socket.on("receive-post", (postContent) => {
            setPostList((list) => [...list, postContent]);
        });

        socket.on("join-alert", (data) => {
            console.log("data: ", data.username);
        });

        socket.on("left-alert", (data) => {
            console.log("data: ", data.username);
        });

        return () => {
            socket.off("receive-post");
            socket.off("join-alert");
            socket.off("left-alert");
        };

    }, [socket]);

    useEffect(() => {
        if (publicContainerRef.current) {
            publicContainerRef.current.scrollTop = -publicContainerRef.current.scrollHeight;
        }
    }, [postList]);

    return (

        <div className='public-container'>
            <nav
                className='dir'
                onClick={scrollToTop}>
                <FontAwesomeIcon icon={faHouseLock} size='2x' />
            </nav>
            <div className='create-post-container'>
                <label className="attach-file">
                    <input
                        type="file"
                        id="image-upload"
                        name="imageUpload"
                        onChange={onImageChange}
                        accept=".jpg, .jpeg, .png" />
                    <FontAwesomeIcon icon={faImage} color='#1f8a82' />
                </label>
                <input
                    type='text'
                    name='post-text'
                    value={currentPost}
                    onChange={handleCurrentPost}
                    onKeyDown={e => { e.key === "Enter" && sendPost(e) }}
                    maxLength={140}
                    placeholder='Join the discussion' />
                <button
                    className='btn'
                    style={{ backgroundColor: "#55a7e5" }}
                    onClick={sendPost}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
            <div
                className="attachment-preview"
                style={{
                    width: "100%",
                }}>
                {
                    (imageObject.file !== null) &&
                    <img style={{ width: "100px", borderRadius: "10px", margin: "1rem" }}
                        src={`data:image/${imageObject.type};base64,${imageObject.blob}`} alt='Preview' />
                }
            </div>
            <div className='public-posts-container' ref={publicContainerRef}>
                {
                    postList.map((postContent, index) => {
                        const showUserMeta = previousSender !== postContent.sender;
                        previousSender = postContent.sender;

                        return (
                            <div className={`post-container ${userData.username === postContent.sender ? "sender" : "other"}`} key={index}>
                                <div className='avi-container'>
                                    <div className={`user-avi ${showUserMeta ? "" : "avi-hide"}`}>{showUserMeta ? postContent.sender[0].toUpperCase() : ""}</div>
                                </div>
                                <div className="post-content">
                                    {
                                        showUserMeta &&
                                        (<div className='user-meta'>
                                            <p className='sender-name'>{postContent.sender}</p>
                                            <p className='timestamp'>{` at ${postContent.timestamp}`}</p>
                                        </div>
                                        )
                                    }
                                    <p className={`text-post ${showUserMeta ? "margin" : "no-margin"}`}>{postContent.post}</p>
                                    {postContent.blob && (
                                        <img
                                            src={`data:image/${postContent.mimeType};base64,${postContent.blob}`}
                                            width="100"
                                            alt="Uploaded"
                                            onClick={() => handleImageClick(`data:image/${postContent.mimeType};base64,${postContent.blob}`)} />
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
        </div>
    )
}

export default Public
