# 全网VIP视频免费破解去广告 · 油猴脚本

一个 Tampermonkey（篡改猴）用户脚本：在爱奇艺 / 腾讯视频 / 优酷 / 芒果TV / B站 / 乐视的**详情页自动用第三方解析线路替换播放器**，顺手去掉播放器广告。

- 脚本本体：[`vip-parse.user.js`](./vip-parse.user.js)（v3.3.2，约 14 KB，无外部依赖）
- 适配：Chrome / Edge + Tampermonkey 5.x（Chrome 138+ 需额外开启「允许用户脚本」）
- 许可：仅供个人学习研究，解析线路均为第三方公开服务，可用性随时变化

> ⚠️ **时效提醒（2026-10-30 复核）**：脚本的注入、路由、URL 规范化三件事全部正常；但**公共解析线路基本团灭**——冰豆云 `bd.jx.cn` 已 302 到失效域名 `jiexi.bot.cd`，黑木耳 `api.heimuer.tv` 弹 Cloudflare 人机验证，其余常见 jx 域名均为停放页/停运页。播放能否成功现在**取决于你有没有一条活着的线路**，脚本本身已经提供了「线路自检」和「自定义接口」来随时换线。

| 平台 | 详情页形态 | 脚本状态 |
|---|---|---|
| 爱奇艺 | `www.iqiyi.com/v_*.html` | ✅ 自动解析（实测出播放器，时长正常） |
| 腾讯视频 | `v.qq.com/x/cover/<cid>.html` → 跳 `.../<cid>/<vid>.html` | ✅ v3.3.0 起修复注入，v3.3.1 起解析地址规范化为真实集数页，SPA 换集跟随 |
| 优酷 | `v.youku.com/v_show/id_*.html` | ✅ 同上（宽 `@match` + 路由跟随） |
| 芒果TV | `www.mgtv.com/b/<cid>/<vid>.html` | ✅ 同上 |
| B站 / 乐视 | `bilibili.com/video/*`、`le.com/ptv/vplay/*` | ✅ 同上 |

---

## 1. 安装

### 1.1 安装 Tampermonkey

Chrome 应用商店搜索「篡改猴 / Tampermonkey」安装，固定到工具栏。

### 1.2 打开 Chrome 的「允许用户脚本」开关（必做）

Chrome 138 起，扩展要在页面里执行 `GM_*` 用户脚本，必须由用户手动授权，否则脚本**静默不运行**——这是"脚本装了但没反应"最常见的原因。

1. 地址栏打开 `chrome://extensions/?id=dhdgffkkebhmkfjojejmpbldmpobfkfo`
2. 找到 **允许运行用户脚本** 开关，打开
3. 回到 Tampermonkey 仪表盘，脚本列表出现即可

### 1.3 导入脚本

任选其一：

- **拖拽**：把 `vip-parse.user.js` 拖进 Tampermonkey 仪表盘窗口 → 点「安装」
- **从 URL 安装**（仓库公开时可用）：
  `chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=utils`
  → 「从 URL 安装」填 `https://raw.githubusercontent.com/<user>/vip-parse-userscript/main/vip-parse.user.js`
- **新建脚本**：仪表盘 → `+` → 粘贴全部内容 → `Ctrl+S` 保存

安装后在 `chrome://extensions` 里确认 Tampermonkey 已启用，脚本行显示「已启用」。

---

## 2. 配置详情页自动解析接口

打开脚本菜单：点击 Tampermonkey 图标 → **解析设置 / 配置解析接口**（或页面上右键菜单同名项），面板内改完点「保存并生效」，页面自动刷新。

| 配置项 | 推荐值 | 说明 |
|---|---|---|
| 详情页自动解析 | 开 | 进入 `iqiyi.com/v_*`、`a_*`、`dianying` 等播放页后自动弹出解析层 |
| 首选解析接口 | 冰豆云 `https://bd.jx.cn/?url=` | 2026-10-30 07:00 起已失效（302 到死域名）；有活线就换掉，别迷信固定线路 |
| 备用接口 | 黑木耳 `https://api.heimuer.tv/?url=` | 会弹 Cloudflare 人机验证，需人工点选才继续 |
| 自定义接口 | `https://xxx/?url={url}` | `{url}` 会被替换为 `encodeURIComponent(当前详情页地址)`；不写占位符则自动拼接 |
| 线路自检 | 面板 →「立即自检全部线路」 | v3.3.2 新增，逐条给出 `✅可用 / ❌连不上 / ❌已停放 / ❌CF人机验证 / ❌已停运` |
| 打开方式 | 页面内嵌 / 新标签页 | 内嵌为全屏遮罩播放器，条上可「新窗口 / 换线路重试 / 关闭」 |
| 自动解析延迟 | 1200 ms | 等站点播放器挂载完成再替换，站点慢可加到 2000~3000 |
| 去广告 | 开 | 隐藏贴片/暂停广告元素并自动点「跳过」 |
| 浮动解析按钮 | 开 | 右下角「VIP解析」，任何页面可手动触发 |

### 接口配置原理

脚本把当前详情页 URL 交给解析站：

```
https://bd.jx.cn/?url=https%3A%2F%2Fwww.iqiyi.com%2Fv_1hdu5bn7yzg.html
```

解析站返回自己的播放器（多数是再套一层 iframe），从而绕过原站会员校验。因此：

- 只要接口模板里的参数名不是 `url`（例如 `?u=`、`?v=`），就把模板写成 `https://站点/?u={url}`
- 接口换域名/停运是常态，失效就在面板里切线路，或填自定义接口

---

## 2.5 腾讯视频专项：为什么 3.2.1 不生效，3.3.0 怎么修的

**症状**：打开腾讯视频播放页，右下角没有「VIP解析」、也不自动解析，控制台连脚本痕迹都没有。

**根因（两个叠加）**：

1. **旧 `@match` 太窄**：`*://v.qq.com/x/cover/*/*` 要求 `/x/cover/` 后必须有两段。而腾讯短链 `v.qq.com/x/cover/mzc002001w361jz.html` 只有一段，命中不了；真正的播放页 `.../<cid>/<vid>.html` 是**客户端跳转**出来的，Tampermonkey 只在文档加载时判定一次 `@match`，跳转后不会重新注入 → 脚本全程没跑。
2. **腾讯是 SPA**：换集、点推荐位都不刷新页面，只改 `history`。即使首次注入成功，换到下一集也不会重新触发自动解析。

**3.3.0 的修法**：

- `@match` 放宽为 `*://v.qq.com/*`（外加 `*.qq.com/x/cover/*`、`*.qq.com/x/page/*` 兜底域名变体），是否解析交给 `isDetailPage()` 在**运行时**判断；
- 新增 `watchRoute()`：定时兜底 + 接管 `history.pushState/replaceState` + 监听 `popstate/hashchange`，URL 一变就 `ensureUi()`（补回按钮）+ `maybeAuto()`（补触发解析）；
- `handled` Set 按 URL 去重，换集自动解析、同一集不会重复弹；用户手动关闭后也不再弹。

**腾讯实测（2026-10-30）**：

| 用例 | 结果 |
|---|---|
| `v.qq.com/x/cover/mzc002001w361jz.html` → 跳 `.../n3371za9efh.html` | ✅ 按钮出现、自动弹解析，线路冰豆云，播放器 `00:00 / 00:54` |
| 解析地址 | `https://bd.jx.cn/?url=https%3A%2F%2Fv.qq.com%2Fx%2Fcover%2Fmzc002001w361jz%2Fn3371za9efh.html` |
| SPA 换集（`pushState` 到 `.../spa_test_ep2.html`） | ✅ 无需刷新，遮罩 iframe 自动换成新集地址 |

腾讯用的还是同一个接口配置：**首选冰豆云 `https://bd.jx.cn/?url=`**，备用黑木耳 `https://api.heimuer.tv/?url=`，无需单独填腾讯专用接口。

### 接口存活自测（Windows PowerShell）

```powershell
$target = [uri]::EscapeDataString('https://www.iqiyi.com/v_1hdu5bn7yzg.html')
$apis = @(
  'https://bd.jx.cn/?url=',
  'https://api.heimuer.tv/?url=',
  'https://jx.xmflv.com/?url=',
  'https://jx.aidouer.net/?url=',
  'https://www.yemu.xyz/?url='
)
foreach ($a in $apis) {
  try {
    $r = Invoke-WebRequest -Uri ($a + $target) -TimeoutSec 8 -UseBasicParsing `
         -Headers @{'User-Agent'='Mozilla/5.0 Chrome/156'}
    $t = if ($r.Content -match '<title>([^<]{0,60})</title>') { $matches[1] } else { '(no title)' }
    "{0,-38} {1} {2}" -f $a, $r.StatusCode, $t
  } catch { "{0,-38} ERR" -f $a }
}
```

判定标准：

- `200` + `<title>player</title>` 或正常播放页 → 可用
- `200` 但标题是「江湖路远，后会无期」→ 解析站已停运
- `200` 但跳到 CMS/博客首页 → 域名已改作他用
- 连接失败 / 超时 → 已下线

---

## 3. 线路实测记录（2026-10-30，两次复核）

**07:00 复核 —— 三大常用线路已全部不可用：**

| 接口 | 结果 |
|---|---|
| `https://bd.jx.cn/?url=` | ❌ 200 但 302 到 `https://jiexi.bot.cd/?url=...`，该域名连不上（浏览器显示"网页可能暂时无法连接"） |
| `https://api.heimuer.tv/?url=` | ⚠️ 200 但 iframe 内弹 **Cloudflare「我不是机器人」**，需人工点选，脚本无法代过 |
| `https://jx.xmflv.com/?url=` | ❌ 停运页「江湖路远，后会无期」 |
| `https://jx.hls.one/?url=` | ❌ 停运页 |
| `https://jx.777jiexi.com/player/?url=` | ❌ 302 到 `router.parklogic.com`（域名停放） |
| `https://jx.4kdv.com/?url=` | ❌ 302 到 `router.parklogic.com`（停放，且会把标签页卡死） |
| `https://jx.wujinkk.com/?url=` | ❌ 停放页「恭喜，站点创建成功！」 |
| `https://jx.2s0.cn` / `jk.8090.fun` / `jx.playerjy.com` / `jx.jsonplayer.com` / `jx.ikunvip.cn` / `jx.lelevod.com` / `play.bozrc.com` / `jx.m3u8.tv` / `jx.ffm3u8.com` / `jx.yaohuabmw.com` | ❌ 连接失败 |

**01:00 首次实测（当时有效，供对照）：**

| 接口 | 结果 |
|---|---|
| `https://bd.jx.cn/?url=` | ✅ 可播；爱奇艺《喜剧人专场》总时长 `01:08:05`，腾讯《尚公主》片段 `00:54` |
| `https://api.heimuer.tv/?url=` | ✅ 200 JS 跳转播放 |

结论：线路池是**小时级**抖动的，同一天内就会从"能播"变成"跳停放域名"。所以判断脚本好坏要看这三件事，而不是看某一集能不能播：

1. 页面有没有 `#yg-fab`（注入成功）
2. 遮罩条有没有出现、`iframe.src` 里的 `url=` 参数是不是**当前真实播放页地址**（URL 规范化）
3. 面板里「立即自检全部线路」的判定结果（`✅可用 / ❌连不上 / ❌已停放 / ❌CF人机验证 / ❌已停运`）

### 换线流程（线路失效时）

1. 播放页点右下角「VIP解析」→ 面板「线路状态 → 立即自检全部线路」，看哪条是 `✅可用`；
2. 全红就说明公共线路已团灭，在「自定义接口」里填你自己找到的线路，模板二选一：
   - 参数名是 `url`：`https://你的线路/?url=`（脚本自动拼 `encodeURIComponent(页面地址)`）
   - 参数名不是 `url`：`https://你的线路/?u={url}`
3. 保存并生效后，自动解析就会走新线路；
4. 想批量验证候选线路，用上面的 PowerShell 片段，跳过标题含 `parklogic / 站点创建成功 / 后会无期 / Just a moment` 的域名。

---

## 4. 常见问题

**脚本装了但页面上没按钮、不自动解析**

1. `chrome://extensions` → Tampermonkey → **允许运行用户脚本** 是否打开；
2. 仪表盘里脚本是否「已启用」；`@match` 现在放宽为整站（`v.qq.com/*` 等），是否解析由 `isDetailPage()` 运行时判断；
3. 打开 F12 → Console 里执行 `!!document.getElementById('yg-fab')` 看脚本是否注入；为 `false` 说明脚本没跑（多为「允许运行用户脚本」没开）。

**腾讯视频/优酷换集后不自动解析**
3.3.0 已用 `watchRoute()` 处理 SPA 路由；若站点再次改路由方式，确认 `isDetailPage()` 的正则能命中新的播放页 URL。

**解析层出来了但黑屏 / 一直转圈**
不是脚本问题，是线路挂了。先自检：面板 →「立即自检全部线路」，全红就按「换线流程」填自定义接口。3.3.2 起自检用 `GM_xmlhttpRequest` 直连线路，能识别 `连不上 / 已停放 / CF人机验证 / 已停运` 四种死法。

**只想解析某一集，不要自动弹**
面板里关掉「详情页自动解析」，改用右下角「VIP解析」手动点。

**站点改版导致按钮消失**
改 `vip-parse.user.js` 里 `isDetailPage()` 的正则，或在文件头补一条 `@match`。

---

## 5. 免责声明

本项目仅用于浏览器扩展技术、脚本注入与前端调试的学习研究。脚本不托管、不代理任何视频内容，节目播放能力完全取决于第三方解析站点；请勿用于商业用途或二次分发牟利。
