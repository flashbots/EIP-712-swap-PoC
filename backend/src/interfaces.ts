import { MessageTypes, TypedMessage, TypedDataV1 } from "@metamask/eth-sig-util"

export interface SignedMessageRequest {
    signedMessage: string,
    // msgParams: TypedMessage<MessageTypes>, // V4
    msgParams: TypedDataV1, // V1
}
