import { MessageTypes, TypedMessage } from "@metamask/eth-sig-util"

export interface SignedMessageRequest {
    trade_signature: string,
    data: TypedMessage<MessageTypes>, // V<3|4>
}
