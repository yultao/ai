### js vs mjs
.js 是普通的 JavaScript 文件，默认用 CommonJS 模块系统（require、module.exports）

.mjs 是明确的 ES模块文件，支持 import / export 语法，Node.js 里用它来区分 ES模块和 CommonJS

CommonJS: js = （require、module.exports）
ES模块:   mjs = js + "type": "module" （import / export）

### how to get a "User OAuth Token"

1. 打开：https://api.slack.com/apps

2. 创建一个新 App，选择 From scratch

3. 命名为 My Personal Agent，选择你的 Workspace

4. 在左侧点击 OAuth & Permissions，添加这些 User Token Scopes：

channels:history
channels:read
groups:history
groups:read
im:history
mpim:history
users:read,
chat:write

5. 设置 Redirect URL(s)：

例如你本地调试可以设为：http://localhost:3000/oauth/callback

点击 “Save URLs”
    https://3d2f-45-44-189-156.ngrok-free.app/oauth/callback

6. 记下：
client id
9121446094692.9162267809888

7. 生成授权 URL
client secret
1a0fefc5632ceb4680a3b2aaf1e1a61b


例如
https://slack.com/oauth/v2/authorize?client_id=9121446094692.9162267809888&user_scope=channels:history,channels:read,groups:history,groups:read,im:history,mpim:history,users:read,chat:write&redirect_uri=https://localhost:3000/oauth/callback

这个URL一开始会报错
“My Personal Agent doesn’t have a bot user to install”




https://3d2f-45-44-189-156.ngrok-free.app/oauth/callback?code=9121446094692.9142080780132.24569cd119a55b936b59426b5f569a6e60f71ad5453f1145fe78d82abff4babb&state=



8. 用 code 换 token
授权后会自动跳转到Redirect URL，所以
https://3d2f-45-44-189-156.ngrok-free.app/oauth/callback?code=9121446094692.9135719400086.6351d4a7e076fe4896f1da19b67a6dfccbfd52633093e5d79f761fd1b7e196fe&state=

可以写个express监听
npm install node-fetch

或者手动post，如get_token_manually.mjs
```
{
  ok: true,
  ok: true,
  app_id: 'A094S7VPTS4',
  authed_user: {
    id: 'U093KD43HHA',
    scope: 'channels:history,groups:history,im:history,mpim:history,channels:read,groups:read,users:read,chat:write',
    access_token: 'xoxp-xx',
    token_type: 'user'
  },
  team: { id: 'T093KD42SLC', name: 'TT' },
  enterprise: null,
  is_enterprise_install: false
}
```

