# 全网VIP视频免费破解去广告 · 油猴脚本

一个 Tampermonkey（篡改猴）用户脚本：在爱奇艺 / 腾讯视频 / 优酷 / 芒果TV / B站 / 乐视的**详情页自动用第三方解析线路替换播放器**，顺手去掉播放器广告。

- 脚本本体：[`vip-parse.user.js`](./vip-parse.user.js)（v3.2.1，约 10 KB，无外部依赖）
- 适配：Chrome / Edge + Tampermonkey 5.x（Chrome 138+ 需额外开启「允许用户脚本」）
- 许可：仅供个人学习研究，解析线路均为第三方公开服务，可用性随时变化

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
| 首选解析接口 | 冰豆云 `https://bd.jx.cn/?url=` | 实测可用，内部用 `?url=` 参数再套一层 iframe 播放 |
| 备用接口 | 黑木耳 `https://api.heimuer.tv/?url=` | 实测可用，JS 跳转播放 |
| 自定义接口 | `https://xxx/?url={url}` | `{url}` 会被替换为 `encodeURIComponent(当前详情页地址)`；不写占位符则自动拼接 |
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

## 3. 已实测线路（2026-10-30）

| 接口 | 结果 |
|---|---|
| `https://bd.jx.cn/?url=` | ✅ 200，`<title>player</title>`，`?url=` 内部建 iframe |
| `https://api.heimuer.tv/?url=` | ✅ 200，JS 重定向播放 |
| `https://jx.xmflv.com/?url=` | ❌ 「江湖路远，后会无期」（停运） |
| `https://jx.aidouer.net/?url=` | ❌ 「江湖路远，后会无期」（停运） |
| `https://www.yemu.xyz/?url=` | ❌ 已变苹果CMS社区页，无播放器 |
| `https://jx.2s0.cn/player/?url=` | ❌ 连接失败 |
| `https://jx.8090.fun/?url=` | ❌ 连接失败 |
| `https://jx.playerjy.com/?url=` | ❌ 连接失败 |
| `https://jx.jsonplayer.com/player/?url=` | ❌ 连接失败 |

爱奇艺详情页实测：`https://www.iqiyi.com/v_1hdu5bn7yzg.html` → 自动解析，线路「冰豆云」，播放器总时长 `01:08:05`（全片，非试看片段）。

---

## 4. 常见问题

**脚本装了但页面上没按钮、不自动解析**

1. `chrome://extensions` → Tampermonkey → **允许运行用户脚本** 是否打开；
2. 仪表盘里脚本是否「已启用」、`@match` 是否命中当前 URL（爱奇艺要 `v_*.html` 这种播放页）；
3. 打开 F12 → Console 看有无 `yg-fab` 元素、有无报错。

**解析层出来了但黑屏 / 一直转圈**
换线路（遮罩条上的「换线路重试」会轮换接口并刷新），或面板里换成实测可用的接口。解析站有并发和地区限制。

**只想解析某一集，不要自动弹**
面板里关掉「详情页自动解析」，改用右下角「VIP解析」手动点。

**站点改版导致按钮消失**
改 `vip-parse.user.js` 里 `isDetailPage()` 的正则，或在文件头补一条 `@match`。

---

## 5. 免责声明

本项目仅用于浏览器扩展技术、脚本注入与前端调试的学习研究。脚本不托管、不代理任何视频内容，节目播放能力完全取决于第三方解析站点；请勿用于商业用途或二次分发牟利。
