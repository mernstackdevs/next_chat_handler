import Head from "next/head";
import { useRouter, Router } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { Form, Modal, Button } from "react-bootstrap";
import { jsonObj } from "../helpers/validation";
import { userServices } from "../services/user.services";
import toast from "./Toast"
import { useAppSelector } from "../rtk/hooks";
import Loader from "./Loader";
import { ChatMessage } from "./Chat/Message";
import useInfiniteScroll from "./useInfiniteScroll";
import { ChatItem } from "./Chat/Item";
import { useAppDispatch } from "../rtk/hooks";
import { profileModal } from "../rtk/slices/profileSlice";

const Message = () => {
    const [data, setData] = useState([]) as Array<any>
    const [messages, setMessages] = useState([]) as Array<any>
    const [msg, setMsg] = useState("")
    const [totalPages, setTotalPages] = useState(0);
    const [totalChatPages, setTotalChatPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentChatPage, setCurrentChatPage] = useState(0);
    const [msgsTotalLength, setMsgsLength] = useState(0)
    const [chatListLength, setChatListLength] = useState(0)
    const [temp, setTemp] = useState(0)
    const [loading, setLoading] = useState(false)
    const [shareFile, setShareFile] = useState(null) as any
    const [previewImgSrc, setPreviewImgSrc] = useState() as any
    const [previewImage, setPreviewImage] = useState(false)
    const [search, setSearch] = useState("")
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [hasMoreChats, setHasMoreChats] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [phoneView, setPhoneView] = useState(false)

    const router = useRouter()
    let shipment_id = router.query.shipment
    const dispatch = useAppDispatch();

    const notify = useCallback((type, message) => {
        toast({ type, message });
    }, []);

    const selector = useAppSelector((state) => state.profile.profile_data);

    const [lastChatMessageRef] = useInfiniteScroll(
        hasMoreMessages ? handleNextMsgs : () => { console.log("messages finished") },
    );

    const [lastChatRef] = useInfiniteScroll(
        hasMoreChats ? handleChatPage : () => { console.log("pages finished") },
    );


    useEffect(() => {
        setLoading(true)
        userServices.chatList(currentChatPage, search).then(resp => {
            let tempData = [] as Array<any>
            if (resp.data.messages) {
                tempData = [...resp.data.messages]
            }
            if (shipment_id) {
                if (tempData.find((chat: any) => chat.shipment_id == window.atob(String(shipment_id))) == undefined) {
                    let chatData = JSON.parse(localStorage.getItem("chatData") as string) as any
                    chatData.active = true
                    tempData.unshift(chatData)
                    getMessages(window.atob(String(shipment_id)), totalPages)
                    setLoading(false)
                } else {
                    tempData.forEach((element: jsonObj) => {
                        if (element.shipment_id == window.atob(String(shipment_id))) {
                            element.active = true
                            element.is_read = '1'
                            getMessages(element.shipment_id, totalPages)
                        } else {
                            element.active = false
                        }
                    })
                    setLoading(false)
                }
            } else {
                setMessages([])
            }
            setData(tempData)
            setChatListLength(resp.data.totalRecords)
            setTotalChatPages(resp.data.totalPages - 1)
            if (resp.data.totalPages > 0) {
                setHasMoreChats(true)
            }
            if (shipment_id) {
                document.getElementById('shipment-' + window.atob(String(shipment_id)))?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
            }
            setLoading(false)
        }).catch((err) => {
            // console.log(err)
            setLoading(false)
        })
    }, [selector, temp])

    useEffect(() => {
        userServices.chatList(currentChatPage, search).then(resp => {
            setData(resp.data.messages)
            setChatListLength(resp.data.totalRecords)
        }).catch(err => {

        })
    }, [search])

    useEffect(() => {
        userServices.getUserProfile(localStorage.getItem('access_token')).then((res) => {
            if (res.status == 200) {
                dispatch(profileModal(res.data));
            }
        }).catch((err) => {
            if (err?.response?.status == 401) {
                localStorage.clear()
                router.push('/login')
            }
        })
    }, [temp])

    function getMessages(id: string, pageCount: Number) {
        userServices.chatMessages(id, pageCount).then(resp => {
            setIsFetching(false)
            setMsgsLength(resp.data.totalRecords)

            if (pageCount > 0) {
                setMessages((data: Array<any>) => data.concat(resp.data.messages))
            } else {
                setMessages(resp.data.messages)
                setTotalPages(resp.data.totalPages - 1)
                if (resp.data.totalPages > 0) {
                    setHasMoreMessages(true)
                }
                setTimeout(() => {
                    scrollToChatBottom()
                }, 200);
            }
        }).catch(err => console.log(err))
    }

    function getActiveChat() {
        return data.find((chat: jsonObj) => chat.active == true)
    }

    function sendMsg() {
        if (msg.trim() != '') {
            let activeChat = getActiveChat()
            let params = {
                shipment_id: activeChat.shipment_id,
                receiver_id: Number(activeChat.receiver_id) == Number(selector?.id) ? activeChat.sender_id : activeChat?.receiver_id,
                message_body: msg
            }
            sendChatMsg(params)
        } else {
            toast.dismiss()
            notify("warn", "Can't send empty message.")
        }
    }

    function sendFile(e: any) {
        var tempFile = e.target.files[0]
        if (!tempFile) {
            return false
        }
        var regex = new RegExp("(.*?)\.(png|jpg|jpeg|doc|docx|xls|xlsx|ppt|pptx|pdf)$");
        if (!(regex.test(tempFile.name))) {
            toast.dismiss()
            notify('warn', 'Please select a valid file.')
            return false;
        } else {
            var regexImg = new RegExp("(.*?)\.(png|jpg|jpeg)$");
            if (regexImg.test(tempFile.name)) {
                setShareFile(e.target.files[0])
                var reader = new FileReader();
                reader.readAsDataURL(e.target.files[0]);
                reader.onloadend = function (ev: any) {
                    setPreviewImgSrc(ev.target?.result);
                }
                setPreviewImage(true)
            } else {
                let activeChat = getActiveChat()
                let formdata = new FormData()
                formdata.append('shipment_id', activeChat.shipment_id)
                formdata.append('receiver_id', Number(activeChat.receiver_id) == Number(selector?.id) ? activeChat.sender_id : activeChat?.receiver_id)
                formdata.append('message_file', e.target.files[0])
                uploadMedia(formdata)
            }
        }
    }

    function sendChatMsg(params: jsonObj) {
        userServices.sendChatMessage(params).then((resp) => {
            setMessages((data: Array<any>) => [resp.data].concat(data))
            setMsg("")
            scrollToChatBottom()
        }).catch((err) => {
            if (err.response?.status == 400) {
                notify("error", err.response.daa.message)
            } else {
                notify("error", "An error occured.")
            }
            console.log(err)
        })
    }

    function uploadMedia(params: FormData) {
        setLoading(true)
        userServices.sendChatMessage(params).then((resp) => {
            setMessages((data: Array<any>) => [resp.data].concat(data))
            setMsg("")
            scrollToChatBottom()
            setLoading(false)
        }).catch((err) => {
            setLoading(false)
            if (err.response?.status == 400) {
                notify("error", err.response.data.message)
            } else {
                notify('error', 'Something went wrong.')
            }
        })
    }

    function scrollToChatBottom() {
        var scrollableDiv = document.getElementById('chat_msg_0') as HTMLDivElement | null
        if (scrollableDiv) scrollableDiv?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' })
    }

    function handleChatPage() {
        if (totalChatPages > currentChatPage)
            userServices.chatList(currentChatPage + 1, search).then(resp => {
                setData((chats: Array<any>) => chats.concat(resp.data.messages))
                setCurrentChatPage((page: number) => page + 1)
            }).catch(err => console.log(err))
    }

    function handleChatClick(index: number) {
        setPhoneView(true)
        // setTotalPages(0)
        let chat = data.at(index)
        let chats = [...data]
        chats.forEach((element: jsonObj) => {
            if (element.shipment_id == chat.shipment_id) {
                element.active = true
                element.is_read = '1'
                getMessages(element.shipment_id, 0)
            } else {
                element.active = false
            }
        })
        setData(chats)
        router.push({
            pathname: '/message',
            query: { shipment: window.btoa(chat.shipment_id) }
        }, undefined, { shallow: true })
    }

    function handleNextMsgs() {
        if (totalPages > currentPage && !isFetching) {
            setIsFetching(true)
            let activeChat = getActiveChat()
            let nextPage = currentPage + 1
            setCurrentPage(nextPage)
            getMessages(activeChat.shipment_id, nextPage)
        }
    }

    function sharePreviewImage() {
        setPreviewImgSrc("")
        let activeChat = getActiveChat()
        let formdata = new FormData()
        formdata.append('shipment_id', activeChat.shipment_id)
        formdata.append('receiver_id', activeChat.receiver_id)
        formdata.append('message_file', shareFile)
        setPreviewImage(false)
        uploadMedia(formdata)
    }

    return <>
        <Head>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
        </Head>
        {loading && <Loader />}
        <section className="bg-grey py-5 editprofile_section common_health">
            <div className="container">
                <h2 className="subheading_h2">Message</h2>
                {
                    phoneView ?
                        <div className="back_btn mb-2" onClick={() => setPhoneView(false)}>
                            <i className="fa fa-angle-left me-2" style={{ fontSize: "21px" }}></i>
                            <span>Back</span>
                        </div>
                        : ""
                }
                <div className={`messaging ${phoneView ? "sm-screen-chat" : ""}`}>
                    <div className="inbox_msg">
                        <div className="inbox_people" id="scrollableChat">
                            <div className="headind_srch">
                                <div className="frominput px-3 py-2">
                                    <Form.Group>
                                        <div className="search_input">
                                            <Form.Control
                                                type="text"
                                                placeholder="Search Here..."
                                                value={search}
                                                onChange={(e) => {
                                                    let val = e.target.value
                                                    if (val.trim() != '' || val == '') {
                                                        setSearch(val)
                                                    }
                                                }}
                                            />
                                            {
                                                search ?
                                                    <img src="/images/trash.svg" alt="" onClick={() => setSearch("")} className="c-pointer" />
                                                    :
                                                    <img src="images/search.svg" alt="" />
                                            }
                                        </div>
                                    </Form.Group>
                                </div>
                            </div>
                            {
                                data.length ?
                                    <div style={{ overflowX: "hidden", overflowY: "auto", maxHeight: "516px" }}>
                                        {data.map((chat: jsonObj, i: number) => {
                                            if (i == data.length - 2) {
                                                return <div ref={lastChatRef} key={i}>
                                                    <ChatItem chat={chat} index={i} clickFunction={() => handleChatClick(i)} setPhoneView={setPhoneView} />
                                                </div>
                                            } else {
                                                return (
                                                    <ChatItem chat={chat} index={i} clickFunction={() => handleChatClick(i)} setPhoneView={setPhoneView} />
                                                )
                                            }
                                        })}
                                    </div>
                                    : <div className="d-flex justify-content-center pt-5">
                                        <h5>No conversation found</h5>
                                    </div>
                            }
                        </div>
                        <div className="mesgs">
                            {
                                messages.length ?
                                    <div className="msg_history" id="scrollableDiv" style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                                        {messages.map((mesg: jsonObj, index: number) => {
                                            if (index == messages.length - 2) {
                                                return (
                                                    <div ref={lastChatMessageRef} key={index}>
                                                        <ChatMessage msg={mesg} i={index} key={mesg.id} activeChat={getActiveChat()} />
                                                    </div>
                                                );
                                            } else {
                                                return <ChatMessage msg={mesg} i={index} key={mesg.id} activeChat={getActiveChat()} />
                                            }
                                        })}
                                    </div>
                                    : messages.length == 0 && getActiveChat() ?
                                        <div className="d-flex justify-content-center pt-5 msg_history">
                                            <h5 style={{ lineHeight: "420px" }}>Send a message to start conversation</h5>
                                        </div>
                                        : data.length && getActiveChat() == undefined && !loading ?
                                            <div className="d-flex justify-content-center pt-5 msg_history">
                                                <h5 style={{ lineHeight: "420px" }}>Select a conversation to continue</h5>
                                            </div>
                                            : <div className="msg_history"></div>
                            }

                            {
                                getActiveChat() ?
                                    <div className="chat_type d-flex">
                                        <Form.Control value={msg} type="text" placeholder="Enter message..."
                                            onKeyPress={(e) => {
                                                if (e.key == 'Enter') {
                                                    sendMsg()
                                                }
                                            }}
                                            onChange={(e) => {
                                                setMsg(e.target.value)
                                            }}
                                        />
                                        <div className="chat_type_right">
                                            <button className="border-0 bg-transparent attachment_btn chat_input_box d-inline-block position-relative c-pointer">
                                                <img className="c-pointer" src="images/paperclip1.svg" alt="" />
                                                <input accept='.png, .jpg, .jpeg, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .pdf' className="c-pointer" type="file" onChange={(e) => sendFile(e)} onClick={(e: any) => e.target.value = ''} />
                                            </button>
                                            <button className="border-0 chat-send-btn" type="button" onClick={() => sendMsg()}>
                                                Send
                                            </button>
                                            <button className="mx-2 border-0 chat-send-btn"
                                                onClick={() => {
                                                    setTotalPages(0)
                                                    setTemp(t => t + 1)
                                                }}
                                            ><i className="fa fa-refresh"></i></button>
                                        </div>
                                    </div>
                                    : ""
                            }

                        </div >
                    </div >
                </div >
            </div >
        </section >
        <Modal show={previewImage} backdrop="static" centered onHide={() => {
            setPreviewImage(false)
            setPreviewImgSrc("")
        }}>
            <Modal.Header>
                <Modal.Title>Preview Image</Modal.Title>
            </Modal.Header>
            <Modal.Body className='d-flex justify-content-center'>
                <div className='p-3'>
                    <img style={{ maxHeight: "420px" }} src={`${previewImgSrc}`} alt="previewImg" />
                </div>
            </Modal.Body>
            <Modal.Footer className='justify-content-around'>
                <button className="border-0 primary-btn" onClick={() => { sharePreviewImage() }}>Send <i className=' pl-2 fa fa-paper-plane'></i> </button>
                <Button variant='unset' className="px-3 bg-danger text-white" onClick={() => setPreviewImage(false)}>Cancel <i className=' pl-2 fa fa-times'></i> </Button>
            </Modal.Footer>
        </Modal>
    </>;
};

export default Message;
