import { faHouseLock, faImage, faBullhorn, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { handleImageChange } from '../../utils/imageUtils';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const Public = ({ socket, userData }) =>
{
    const [currentPost, setCurrentPost] = useState("");
    const [postList, setPostList] = useState([]);
    const [imageObject, setImageObject] = useState({
        file: null,
        blob: "",
        type: ""
    });

    const [projectedImage, setProjectedImage] = useState(null);
    const [showPublicChat, setShowPublicChat] = useState(true);

    let previousSender = null;
    const postsContainerRef = useRef(null);

    const handleImageClick = (imageSrc) =>
    {
        setProjectedImage(imageSrc);
    };

    const closeProjectedImage = () =>
    {
        setProjectedImage(null);
    };

    const handleCurrentPost = (e) =>
    {
        setCurrentPost(e.target.value);
    };

    const onImageChange = (e) =>
    {
        const file = e.target.files[0];
        handleImageChange(file, setImageObject);
    };

    const groupPostsByDate = (posts) =>
    {
        return posts.reduce((groups, post) =>
        {
            const date = post.date;
            if (!groups[date])
            {
                groups[date] = [];
            }
            groups[date].push(post);
            return groups;
        }, {});
    };

    const groupedPosts = groupPostsByDate(postList);

    const sendPost = async (e) =>
    {
        e.preventDefault();

        if (currentPost !== "" || imageObject.file !== null)
        {
            const postContent = {
                room: "public",
                sender: userData.username,
                post: currentPost,
                timestamp: moment().format("LT"),
                date: moment().format("YYYY-MM-DD"),
                index: Date.now(),
                blob: imageObject.blob,
                mimeType: imageObject.type,
            };

            await socket.emit("send-post", postContent);
            try
            {
                await addDoc(collection(db, 'posts'), postContent);
                setPostList((list) => [...list, postContent]);
                setCurrentPost("");

                setImageObject({
                    file: null,
                    blob: "",
                    type: ""
                });
            } catch (e)
            {
                console.error("Error adding document: ", e);
            }
        }
    };

    const handleImageUndo = () =>
    {
        setImageObject({
            file: null,
            blob: "",
            type: ""
        });
    };

    const togglePublicChat = () =>
    {
        setShowPublicChat(prevState => !prevState);
    };

    useEffect(() =>
    {
        socket.on("receive-post", (postContent) =>
        {
            setPostList((list) => [...list, postContent]);
        });

        socket.on("join-alert", (data) =>
        {
            console.log("online user: ", data.username);
        });

        socket.on("left-alert", (data) =>
        {
            console.log("offline user: ", data.username);
        });

        return () =>
        {
            socket.off("receive-post");
            socket.off("join-alert");
            socket.off("left-alert");
        };

    }, [socket]);

    useEffect(() =>
    {
        if (postsContainerRef.current)
        {
            postsContainerRef.current.scrollTop = -postsContainerRef.current.scrollHeight;
        }
    }, [postList]);

    useEffect(() =>
    {
        const fetchPosts = async () =>
        {
            const querySnapshot = await getDocs(collection(db, 'posts'));
            const posts = querySnapshot.docs.map(doc => doc.data());
            setPostList(posts);
        };

        fetchPosts();
    }, []);

    return (
        <div className='public-container' style={{ height: showPublicChat ? "100vh" : "0" }}>
            <nav
                className='dir'
                onClick={togglePublicChat}>
                <FontAwesomeIcon icon={showPublicChat ? faHouseLock : faBullhorn} size='2x' />
            </nav>
            <div className='create-post-container'>
                <div className='post-input-group'>
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
                </div>
                <button
                    className='post-button'
                    id='post-to-public'
                    style={{ backgroundColor: "#55a7e5" }}
                    onClick={sendPost}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
            <div
                className="attachment-preview"
                onClick={handleImageUndo}>
                {
                    (imageObject.file !== null) &&
                    <>
                        <p>File Preview</p>
                        <img
                            src={`data:image/${imageObject.type};base64,${imageObject.blob}`}
                            alt='Preview' />
                    </>
                }
            </div>
            <div className='public-posts-container'>
                {Object.keys(groupedPosts).map((date, index) => (
                    <div className='grouped-by-date' ref={postsContainerRef} key={index}>
                        {groupedPosts[date].map((postContent, index) =>
                        {
                            const showUserMeta = previousSender !== postContent.sender;
                            previousSender = postContent.sender;

                            return (
                                <div className={`post-container ${userData.username === postContent.sender ? "sender" : "other"}`} key={index}>
                                    <div className='avi-container'>
                                        <div className={`user-avi ${showUserMeta ? "" : "avi-hide"}`}>{showUserMeta ? postContent.sender[0].toUpperCase() : ""}</div>
                                    </div>
                                    <div className="post-content">
                                        {showUserMeta && (
                                            <div className='user-meta'>
                                                <p className='sender-name'>{postContent.sender}</p>
                                                <p className='timestamp'>{` at ${postContent.timestamp}`}</p>
                                            </div>
                                        )}
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
                        })}
                        <div className='date-header'>
                            <p>
                                {moment(date).calendar(null, {
                                    sameDay: '[Today]',
                                    nextDay: '[Tomorrow]',
                                    nextWeek: 'dddd',
                                    lastDay: '[Yesterday]',
                                    lastWeek: '[Last] dddd',
                                    sameElse: 'MMMM Do YYYY'
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <p className='public-room-label'>public room</p>
        </div>
    );
};

export default Public;
