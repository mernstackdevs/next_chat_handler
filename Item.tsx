import { config } from "../../config/config"
import { jsonObj } from "../../helpers/validation"
import { useAppSelector } from "../../rtk/hooks";
import moment from "moment";
import { SetStateAction, Dispatch } from "react";

interface ItemInterface {
    chat: jsonObj,
    index: number,
    setPhoneView: Dispatch<SetStateAction<boolean>>,
    clickFunction: Function
}
export const ChatItem = ({ chat, index, clickFunction, setPhoneView }: ItemInterface) => {
    const selector = useAppSelector((state) => state.profile.profile_data);
    let bgColor = ''
    if (chat.is_read == '0' && chat.sender_id != selector?.id) {
        bgColor = '#F6A931'
    }
    return (
        <>
            <div id={`shipment-${chat.shipment_id}`} className={`inbox_chat ${chat.active ? "active_chat" : ""}`} key={index} onClick={() => clickFunction(index)}>
                <div className="chat_header" style={{ background: bgColor }}>
                    <div className="position-relative leftside_header">
                        <img src={chat.other_user?.company ? `${config.imageUrl}${chat.other_user.company.company_picture}` : "/images/user_icon.svg"} alt="" />
                        <div className="row">
                            <div className="col">
                                <h5 className="mb-1">{chat.other_user?.company?.company_name ? chat.other_user.company.company_name : chat.other_user?.first_name ? chat.other_user?.first_name : chat?.cname}
                                </h5>
                            </div>
                            <div className="col-auto">
                                <span style={{ fontSize: "13px" }} className="mb-0 chattime">{moment(chat.created_at).tz("Asia/Dubai").format("YYYY/MM/DD HH:mm")}</span>
                            </div>
                        </div>
                        <h6>{chat.tra ? chat.tra : chat.shipment?.tra_no ? chat.shipment.tra_no : ""}</h6>
                        <p className="msg_1">
                            {
                                chat.is_read == "0" && chat.sender_id != selector?.id ?
                                    <>
                                        <i style={{ color: "#F6A931" }} className="fa fa-envelope"></i> {" "}
                                    </>
                                    : ""
                            }
                            {chat.message_type == 'T' ? chat.message_body
                                : chat.message_type == 'F' && (chat.message_body.endsWith('.jpg') || chat.message_body.endsWith('.png' || chat.message_body.endsWith('.jpeg'))) ? "Image" : chat.message_type == 'F' ? "File" : ""
                            }
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}