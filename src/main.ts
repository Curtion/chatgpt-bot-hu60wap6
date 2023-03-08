import { ChatGPTAPI } from 'chatgpt'
import config from '../config'
const api = new ChatGPTAPI({ 
  apiKey: config.apiKey
})

async function example() {
  const res = await api.sendMessage('找不到模块“chatgpt”。你的意思是要将 "moduleResolution" 选项设置为 "node"，还是要将别名添加到 "paths" 选项中?')
  console.log(res.text)
}
example()