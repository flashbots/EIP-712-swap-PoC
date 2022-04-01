import { MessageTypes, TypedMessage, TypedDataV1 } from "@metamask/eth-sig-util"

export interface SignedMessageRequest {
    signedMessage: string,
    data: TypedMessage<MessageTypes>, // V<3|4>
    // data: TypedDataV1, // V1
}
