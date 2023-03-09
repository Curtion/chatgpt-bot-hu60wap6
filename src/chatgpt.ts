import { ChatGPTAPI } from 'chatgpt'
import config from '../config.js'
import session from './session.js';
const api = new ChatGPTAPI({
  apiKey: config.apiKey
})

export default class ChatGPT {
  static async sendMessage(text: string, uid: number) {
    let res = null
    console.log(session[uid])
    if (session[uid] == undefined) {
      res = await api.sendMessage(text);
      session[uid] = res.id
    } else {
      res = await api.sendMessage(text, {
        parentMessageId: session[uid]
      });
    }
    return res
  }
}