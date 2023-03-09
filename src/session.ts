export const botInfo: hu60BotInfo = {
  sid: '',
  uid: 0,
}

let session: session = {}

export function clearSession() {
  for (let key in session) {
    if (session[key].replyDate < Date.now() - 1000 * 60 * 60 * 24) {
      delete session[key]
    }
  }
}
export default session