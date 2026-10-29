// ==UserScript==
// @name         全网VIP视频免费破解去广告
// @namespace    https://yg.local/vip-parse
// @version      3.3.0
// @description  多平台VIP视频解析（爱奇艺/腾讯/优酷/芒果/B站/乐视）、详情页自动解析、SPA 路由跟随、去广告
// @author       YG
// @match        *://*.iqiyi.com/*
// @match        *://v.qq.com/*
// @match        *://*.qq.com/x/cover/*
// @match        *://*.qq.com/x/page/*
// @match        *://*.youku.com/*
// @match        *://*.mgtv.com/*
// @match        *://*.bilibili.com/video/*
// @match        *://*.le.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /* ==================== 默认配置 ==================== */
  const DEFAULT_APIS = [
    { name: '冰豆云(可用)',   url: 'https://bd.jx.cn/?url=' },
    { name: '黑木耳(可用)',   url: 'https://api.heimuer.tv/?url=' },
    { name: '量子云(备用)',   url: 'https://jx.2s0.cn/player/?url=' },
    { name: '8090(备用)',     url: 'https://jx.8090.fun/?url=' },
    { name: '自定义',         url: '' }
  ];

  const DEF = {
    autoParse:    true,      // 详情页自动解析
    apiIndex:     0,         // 首选解析接口下标
    customApi:    '',        // 自定义接口模板，用 {url} 占位
    openMode:     'iframe',  // iframe | newtab
    delay:        1200,      // 自动解析延迟(ms)
    removeAds:    true,      // 去广告
    showFloatBtn: true       // 页面浮动解析按钮
  };

  const cfg = Object.assign({}, DEF, GM_getValue('cfg', {}));
  const save = () => GM_setValue('cfg', cfg);

  const apiList = GM_getValue('apis', DEFAULT_APIS);
  const apiUrl = () => {
    if (cfg.apiIndex === apiList.length - 1 || (apiList[cfg.apiIndex] && apiList[cfg.apiIndex].name === '自定义')) {
      return cfg.customApi || DEFAULT_APIS[0].url;
    }
    return (apiList[cfg.apiIndex] || DEFAULT_APIS[0]).url;
  };

  /* ==================== 平台识别 ==================== */
  // 注意：腾讯视频 / 优酷 / 芒果 都是 SPA，URL 会在不刷新的情况下变化，
  // 所以判定放在“当前 URL”上，并由下面的路由监听反复调用。
  const isDetailPage = () => {
    const u = location.href;
    return /iqiyi\.com\/(v_|a_|dianying|movie|tv)/.test(u)
        || /v\.qq\.com\/x\/(cover|page)\//.test(u)
        || /\.qq\.com\/x\/(cover|page)\//.test(u)
        || /youku\.com\/v_show\//.test(u)
        || /mgtv\.com\/b\//.test(u)
        || /bilibili\.com\/video\//.test(u)
        || /le\.com\/ptv\/vplay\//.test(u);
  };

  const parseUrl = (target) => {
    const base = apiUrl();
    if (!base) return '';
    return /{url}/.test(base)
      ? base.replace('{url}', encodeURIComponent(target))
      : base + encodeURIComponent(target);
  };

  /* ==================== 播放器替换 / 弹窗 ==================== */
  function openParse(target, mode) {
    const u = parseUrl(target || location.href);
    if (!u) { alert('请先在“解析设置”里配置解析接口'); return; }

    if (mode === 'newtab') { window.open(u, '_blank'); return; }

    let box = document.getElementById('yg-parse-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'yg-parse-box';
      box.innerHTML = `
        <div class="yg-bar"><span class="yg-title">VIP解析 · 线路：${(apiList[cfg.apiIndex] || {}).name || '自定义'}</span>
          <span class="yg-ops">
            <a class="yg-btn" data-act="newtab">新窗口</a>
            <a class="yg-btn" data-act="reload">换线路重试</a>
            <a class="yg-btn yg-close" data-act="close">关闭</a>
          </span></div>
        <iframe allowfullscreen allow="autoplay; fullscreen; encrypted-media" referrerpolicy="no-referrer"></iframe>`;
      document.body.appendChild(box);
      box.addEventListener('click', (e) => {
        const act = e.target.dataset && e.target.dataset.act;
        if (!act) return;
        e.preventDefault();
        if (act === 'close') box.remove();
        if (act === 'newtab') window.open(parseUrl(location.href), '_blank');
        if (act === 'reload') { cfg.apiIndex = (cfg.apiIndex + 1) % apiList.length; save(); location.reload(); }
      });
    }
    box.querySelector('iframe').src = u;
  }

  /* ==================== 设置面板 ==================== */
  function openSettings() {
    const opts = apiList.map((a, i) =>
      `<option value="${i}" ${i === cfg.apiIndex ? 'selected' : ''}>${a.name}</option>`).join('');

    const wrap = document.createElement('div');
    wrap.id = 'yg-set';
    wrap.innerHTML = `
      <div class="yg-card">
        <h3>全网VIP视频 · 解析设置</h3>
        <label class="yg-row"><input type="checkbox" id="yg-auto" ${cfg.autoParse ? 'checked' : ''}>
          <b>详情页自动解析</b><span>进入播放页自动用解析线路替换播放器</span></label>
        <label class="yg-row"><span>首选解析接口</span><select id="yg-api">${opts}</select></label>
        <label class="yg-row"><span>自定义接口</span><input id="yg-custom" placeholder="https://xxx/?url={url}" value="${cfg.customApi}"></label>
        <label class="yg-row"><span>打开方式</span><select id="yg-mode">
          <option value="iframe" ${cfg.openMode === 'iframe' ? 'selected' : ''}>页面内嵌</option>
          <option value="newtab" ${cfg.openMode === 'newtab' ? 'selected' : ''}>新标签页</option></select></label>
        <label class="yg-row"><span>自动解析延迟(ms)</span><input id="yg-delay" type="number" min="0" max="15000" step="100" value="${cfg.delay}"></label>
        <label class="yg-row"><input type="checkbox" id="yg-ads" ${cfg.removeAds ? 'checked' : ''}><b>去广告</b></label>
        <label class="yg-row"><input type="checkbox" id="yg-fb" ${cfg.showFloatBtn ? 'checked' : ''}><b>显示浮动解析按钮</b></label>
        <div class="yg-foot"><button id="yg-save">保存并生效</button><button id="yg-close">取消</button></div>
      </div>`;
    document.body.appendChild(wrap);

    wrap.querySelector('#yg-close').onclick = () => wrap.remove();
    wrap.querySelector('#yg-save').onclick = () => {
      cfg.autoParse = wrap.querySelector('#yg-auto').checked;
      cfg.apiIndex = +wrap.querySelector('#yg-api').value;
      cfg.customApi = wrap.querySelector('#yg-custom').value.trim();
      cfg.openMode = wrap.querySelector('#yg-mode').value;
      cfg.delay = Math.max(0, +wrap.querySelector('#yg-delay').value || 0);
      cfg.removeAds = wrap.querySelector('#yg-ads').checked;
      cfg.showFloatBtn = wrap.querySelector('#yg-fb').checked;
      save();
      wrap.remove();
      location.reload();
    };
  }

  /* ==================== 去广告 ==================== */
  function killAds() {
    if (!cfg.removeAds) return;
    const css = `
      .qy-player-ad, .iqp-player-ad, [class*="pause-ad"], [class*="player-ad"],
      .qy-player-vippay-popup, .iqp-vip-guide, .iqp-star-float,
      div[class*="advert"], #qy-player-ad, .qy-player-guide-popup,
      .txp_ad, .txp_ad_skip, [class*="txp-ad"], [class*="mod_ad"] { display:none !important; }
    `;
    GM_addStyle(css);

    const timer = setInterval(() => {
      const btns = document.querySelectorAll(
        '.qy-player-ad-close, .iqp-player-ad-close, [class*="skip"], [class*="Skip"], [class*="closeAd"], .txp_ad_skip');
      btns.forEach(b => { if (/跳过|关闭|skip|close/i.test(b.textContent || b.className)) b.click(); });
      const v = document.querySelector('video');
      if (v && v.duration > 0) {
        const ad = document.querySelector('.qy-player-ad, .iqp-player-ad, [class*="player-ad"], [class*="txp-ad"]');
        if (ad && ad.offsetParent !== null) v.muted = true;
      }
    }, 1000);
    setTimeout(() => clearInterval(timer), 120000);
  }

  /* ==================== 浮动按钮 ==================== */
  function ensureUi() {
    if (!cfg.showFloatBtn) return;
    if (document.getElementById('yg-fab')) return;
    if (!document.body) return;
    const b = document.createElement('div');
    b.id = 'yg-fab';
    b.textContent = 'VIP解析';
    b.title = '当前页面：' + location.href;
    b.onclick = () => openParse(location.href, cfg.openMode);
    document.body.appendChild(b);
  }

  GM_addStyle(`
    #yg-fab{position:fixed;right:18px;bottom:120px;z-index:2147483000;background:#ff5f00;color:#fff;
      padding:10px 14px;border-radius:22px;font:14px/1.2 system-ui;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)}
    #yg-parse-box{position:fixed;inset:0;z-index:2147483600;background:#000;display:flex;flex-direction:column}
    #yg-parse-box .yg-bar{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;
      background:#111;color:#eee;font:13px system-ui}
    #yg-parse-box .yg-btn{margin-left:10px;color:#7cc4ff;cursor:pointer}
    #yg-parse-box iframe{flex:1;width:100%;border:0;background:#000}
    #yg-set{position:fixed;inset:0;z-index:2147483700;background:rgba(0,0,0,.55);display:flex;
      align-items:center;justify-content:center;font:14px system-ui}
    #yg-set .yg-card{background:#fff;color:#222;border-radius:10px;padding:20px 22px;width:460px;max-width:92vw}
    #yg-set h3{margin:0 0 14px;font-size:16px}
    #yg-set .yg-row{display:flex;align-items:center;gap:8px;margin:10px 0;flex-wrap:wrap}
    #yg-set .yg-row span:first-child{min-width:104px;color:#555}
    #yg-set .yg-row span{color:#888;font-size:12px}
    #yg-set input[type=text],#yg-set input:not([type]),#yg-set input[type=number],#yg-set select{
      flex:1;min-width:120px;padding:6px 8px;border:1px solid #ddd;border-radius:6px}
    #yg-set .yg-foot{margin-top:16px;text-align:right}
    #yg-set button{padding:7px 16px;margin-left:8px;border:0;border-radius:6px;cursor:pointer;background:#eee}
    #yg-set #yg-save{background:#ff5f00;color:#fff}
  `);

  /* ==================== 自动解析（含 SPA 路由跟随） ==================== */
  const handled = new Set();     // 已自动解析过的 URL，避免回弹重开
  let lastUrl = '';

  function maybeAuto() {
    if (!cfg.autoParse) return;
    if (!isDetailPage()) return;
    const href = location.href;
    if (handled.has(href)) return;
    handled.add(href);
    setTimeout(() => {
      if (document.getElementById('yg-parse-box')) return;   // 用户已手动开过
      openParse(href, cfg.openMode);
    }, cfg.delay);
  }

  function onUrlChange() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    ensureUi();      // SPA 切页可能重建 body，按钮丢了就补回来
    maybeAuto();     // 腾讯/优酷/芒果 换集不刷新，这里补触发
  }

  function watchRoute() {
    lastUrl = location.href;
    // 1) 定时兜底（SPA 常用 router，不一定动 history 对象）
    setInterval(onUrlChange, 700);
    // 2) 主动接管 history，切换瞬间就触发
    ['pushState', 'replaceState'].forEach(k => {
      const orig = history[k];
      if (typeof orig !== 'function') return;
      history[k] = function () {
        const r = orig.apply(this, arguments);
        setTimeout(onUrlChange, 0);
        return r;
      };
    });
    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('hashchange', onUrlChange);
  }

  /* ==================== 启动 ==================== */
  const boot = () => {
    killAds();
    ensureUi();
    watchRoute();
    maybeAuto();
    GM_registerMenuCommand('解析设置 / 配置解析接口', openSettings);
    GM_registerMenuCommand('立即解析当前页面', () => openParse(location.href, cfg.openMode));
  };

  if (document.body) boot(); else window.addEventListener('DOMContentLoaded', boot);
})();
