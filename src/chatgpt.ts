import { ChatGPTAPI } from 'chatgpt'
import config from '../config.js'
import session from './session.js';
const api = new ChatGPTAPI({
  apiKey: config.apiKey
})

export default class ChatGPT {
  static async sendMessage(text: string, uid: number) {
    let res = null
    if (session[uid] == undefined) {
      res = await api.sendMessage(text);
      session[uid] = {
        id: res.id,
        replyDate: Date.now()
      }
    } else {
      res = await api.sendMessage(text, {
        parentMessageId: session[uid].id
      });
      session[uid].replyDate = Date.now()
    }
    return res
  }
}