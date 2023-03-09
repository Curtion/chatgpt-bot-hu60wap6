type hu60BotInfo = {
  uid: number,
  sid: string,
}

interface session {
  [name: string]: {
    id: string,
    replyDate: number,
  },
}