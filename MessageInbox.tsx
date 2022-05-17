import moment from "moment-timezone";
import { config } from "../../config/config";
import { jsonObj } from "../../helpers/validation";
import { useAppSelector } from "../../rtk/hooks";

interface Message {
    msg: jsonObj,
    i: number,
    activeChat: jsonObj
}
export const ChatMessage = ({ msg, i, activeChat }: Message) => {
    const selector = useAppSelector((state) => state.profile.profile_data)

    function msgType(msg: string) {
        if (msg.toLowerCase().endsWith("png") || msg.toLowerCase().endsWith("jpg") || msg.toLowerCase().endsWith("jpeg")) {
            return (
                <a rel="noreferrer" href={`${config.imageUrl}${msg}`} target="_blank">
                    <img width={200} src={`${msg ? config.imageUrl + msg : ""}`} alt="" />
                </a>
            )
        }
        if (msg.toLowerCase().endsWith("doc") || msg.toLowerCase().endsWith("docx")) {
            return (
                <a rel="noreferrer" href={`${config.imageUrl}${msg}`} target="_blank">
                    <img width={150} src={'/images/word.png'} alt="" />
                </a>
            )
        }
        if (msg.toLowerCase().endsWith("xls") || msg.toLowerCase().endsWith("xlsx")) {
            return (
                <a rel="noreferrer" href={`${config.imageUrl}${msg}`} target="_blank">
                    <img width={150} src={'/images/excel.png'} alt="" />
                </a>
            )
        }
        if (msg.toLowerCase().endsWith("ppt") || msg.toLowerCase().endsWith("pptx")) {
            return (
                <a rel="noreferrer" href={`${config.imageUrl}${msg}`} target="_blank">
                    <img width={150} src={'/images/ppt.png'} alt="" />
                </a>
            )
        }
        if (msg.toLowerCase().endsWith("pdf")) {
            return (
                <a rel="noreferrer" href={`${config.imageUrl}${msg}`} target="_blank">
                    <img width={150} src={'/images/pdf.jpg'} alt="" />
                </a>
            )
        }
        else {
            return (
                msg
            )
        }
    }
    return <>
        {
            msg.sender_id == selector?.id
                ?
                <div id={'chat_msg_' + i} className="left_chat right_chat pe-2" key={msg.id}>
                    <div>
                        <p className="mb-1"><span>{moment(msg.created_at).tz("Asia/Dubai").format("YYYY/MM/DD HH:mm")}</span></p>
                        {
                            <div className="messages_p">
                                {msg.message_type == 'T' ?
                                    msg.message_body
                                    : msgType(msg.message_body)
                                }
                            </div>
                        }
                    </div>
                </div>
                :
                <div id={'chat_msg_' + i} className="incoming_msg" key={msg.id}>
                    <div className="left_chat">
                        <img src={activeChat?.other_user?.company?.company_picture ? `${config.imageUrl}${activeChat.other_user.company.company_picture}` : "/images/user_icon.svg"} alt="" className="user_img_1" />
                        <div>
                            <p className="mb-1"><span>{moment(msg.created_at).tz("Asia/Dubai").format("YYYY/MM/DD HH:mm")}</span></p>
                            {
                                <div className="messages_p">
                                    {msg.message_type == 'T' ?
                                        msg.message_body
                                        : msgType(msg.message_body)
                                    }
                                </div>
                            }
                        </div>
                    </div>
                </div>
        }
    </>
}