import { MessageTypes, TypedMessage } from "@metamask/eth-sig-util"

export interface SignedMessageRequest {
    signedMessage: string,
    data: TypedMessage<MessageTypes>, // V<3|4>
}
