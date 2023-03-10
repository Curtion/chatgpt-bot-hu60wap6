import config from '../config.js'
import { botInfo } from './session.js'
import { sleep } from './utils.js'
import api from './chatgpt.js'

// 读取@消息
async function readAtInfo(): Promise<any> {
  let response = await fetch(`${config.hu60Url}${botInfo.sid}/msg.index.@.no.json?_origin=*&_json=compact&_content=json`, {
    redirect: "manual"
  });
  if (response.type == 'opaqueredirect') {
    // 登录失效，要求重新登录
    await login();
    return await readAtInfo();
  }
  return await response.json();
}

// 回复@信息
async function replyAtInfo(info: any) {
  try {
    let uid = info.byuid;
    let url = info.content[0].url;
    // 防止自己和自己对话
    if (uid == botInfo.uid || uid < 1) {
      return;
    }
    console.log('replyAtInfo', config.hu60Url + url.replace('{$BID}', 'html'));
    let topicObject = await readTopicContent(url);
    let text = undefined;
    if (topicObject.error === 'true') {
      console.log(topicObject.errInfo.message)
      return
    }
    if (topicObject.tContents) {
      text = topicObject.tContents[0]?.content;
    } else {
      text = topicObject.chatList[0]?.content;
    }
    if (text === undefined) return
    text = text.trim().replace(/^发言待审核，仅管理员和作者本人可见。/s, '').trim();
    console.log('内容:', text)

    let replyText = await sendText(text, uid);
    try {
      let response = await replyTopic(uid, replyText, topicObject);
      if (response.type == 'opaqueredirect') {
        console.log('success:', true);
      } else {
        console.log(await response.text());
      }
    } catch (ex) {
      console.error(ex);
    }
  } catch (ex) {
    console.error(ex);
  }
}

// 发送聊天信息
async function sendText(text: string, uid: number) {
  try {
    let res = await api.sendMessage(text, uid);
    return res.text
  } catch (error) {
    return error
  }
}

// 读取帖子内容
async function readTopicContent(path: string) {
  let url = config.hu60Url + botInfo.sid + '/' + path.replace('{$BID}', 'json')
    .replace(/#.*$/s, '') // 去掉锚链接
    .replace(
      /\?|$/s, // 注意主题帖的@链接不含问号
      '?_origin=*&_json=compact&_content=text&pageSize=1&'
    );
  let response = await fetch(url);
  return await response.json();
}

// 回复帖子
async function replyTopic(uid: any, replyText: any, topicObject: any) {
  let content = "<!md>\n";
  content += "@#" + uid + "，";

  // 如果开头是ASCII中的非字母数字，则添加换行。
  // 开头可能是markdown标记，比如“```”、“*”、“#”等。
  if (/^[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]/.test(replyText)) {
    content += "\n";
  }

  content += replyText;
  console.log('replyTopic', content);

  let url = null;
  if (topicObject.tMeta) { // 帖子
    url = 'bbs.newreply.' + encodeURIComponent(topicObject.tContents[0].topic_id) + '.json';
  } else { // 聊天室
    url = 'addin.chat.' + encodeURIComponent(topicObject.chatRomName) + '.json';
  }

  let formData = new FormData();
  formData.append('content', content);
  formData.append('token', topicObject.token);
  formData.append('go', '1');

  let response = await fetch(config.hu60Url + botInfo.sid + '/' + url + '?_origin=*&_json=compact', {
    body: formData,
    method: "post",
    redirect: "manual" // 不自动重定向
  });
  return response;
}

// 登录
async function login(): Promise<hu60BotInfo> {
  try {
    let formData = new FormData()
    formData.append('type', '1') // 用户名登录
    formData.append('name', config.username)
    formData.append('pass', config.password)
    formData.append('go', '1')
    let response = await fetch(config.hu60Url + 'user.login.json?_origin=*&_json=compact', {
      body: formData,
      method: "post",
      redirect: "manual" // 不自动重定向
    })
    let result = await response.json();
    if (!result.success) {
      throw result.notice
    }
    botInfo.sid = result.sid
    botInfo.uid = result.uid
    return {
      sid: result.sid,
      uid: result.uid,
    };
  } catch (ex) {
    throw ex
  }
}

export async function run() {
  await login()
  while (true) {
    try {
      let atInfo = await readAtInfo();
      // @消息是后收到的在前面，所以从后往前循环，先发的先处理
      for (let i = atInfo.msgList.length - 1; i >= 0; i--) {
        try {
          await replyAtInfo(atInfo.msgList[i]);
          await sleep(100);
        } catch (ex) {
          console.error(ex);
          await sleep(1000);
        }
      }
      await sleep(5000);
    } catch (ex) {
      console.error(ex);
      await sleep(1000);
    }
  }
}