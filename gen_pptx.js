const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "News Report";
pptx.title = "2026年5月 新闻月报";

const C = {
  bg: "0B0C10", surface: "111318", border: "1E2029",
  red: "E63946", cyan: "00B4D8", amber: "F4A261",
  purple: "7C4DFF", green: "2ECC71",
  text: "B8BBC4", dim: "5D606B", bright: "EDEEEF", white: "FFFFFF",
};

// Load image manifest
const IMG = {};
const manifestPath = path.join(__dirname, "img_manifest.json");
if (fs.existsSync(manifestPath)) {
  Object.assign(IMG, JSON.parse(fs.readFileSync(manifestPath, "utf8")));
}
function imgPath(name) { return IMG[name] || null; }
function hasImg(name) { return !!IMG[name]; }

function darkBg(s) { s.background = { color: C.bg }; }

function addSlideNum(s, n) {
  s.addText(`0${n}`, { x: 8.8, y: 0.2, w: 1, h: 0.6, fontSize: 32, fontFace: "Arial", bold: true, color: "1A1C24", align: "right" });
}

function sectionTitle(s, tag, title, hlWord, hlColor) {
  s.addText(tag.toUpperCase(), { x: 0.6, y: 0.35, w: 4, h: 0.3, fontSize: 9, fontFace: "Arial", bold: true, color: hlColor || C.red, letterSpacing: 3 });
  const p = title.split(hlWord);
  s.addText([
    { text: p[0], options: { fontSize: 30, bold: true, color: C.bright, fontFace: "Arial" } },
    { text: hlWord, options: { fontSize: 30, bold: true, color: hlColor || C.red, fontFace: "Arial" } },
    { text: p[1] || "", options: { fontSize: 30, bold: true, color: C.bright, fontFace: "Arial" } },
  ], { x: 0.6, y: 0.7, w: 8, h: 0.65 });
}

// Card: use real image if available, else decorative shape
function card(s, x, y, w, h, tag, tc, title, body, imgName, decoColor, decoIcon) {
  s.addShape("rect", { x, y, w, h, fill: { color: C.surface }, rectRadius: 0.1, line: { color: C.border, width: 0.5 } });
  const topH = h * 0.44;

  if (hasImg(imgName)) {
    // Use real image
    s.addImage({ path: imgPath(imgName), x, y, w, h: topH, sizing: { type: "cover", w, h: topH } });
  } else {
    // Fallback: decorative header
    s.addShape("rect", { x, y, w, h: topH, fill: { color: decoColor, transparency: 75 } });
    s.addText(decoIcon, { x, y: y + 0.08, w, h: topH - 0.16, fontSize: 28, align: "center", valign: "middle" });
  }

  s.addShape("rect", { x: x + 0.12, y: y + topH + 0.08, w: 0.5, h: 0.025, fill: { color: tc } });
  s.addText(tag, { x: x + 0.12, y: y + topH + 0.16, w: w - 0.24, h: 0.2, fontSize: 7, bold: true, color: tc, fontFace: "Arial" });
  s.addText(title, { x: x + 0.12, y: y + topH + 0.34, w: w - 0.24, h: 0.32, fontSize: 11, bold: true, color: C.bright, fontFace: "Arial" });
  s.addText(body, { x: x + 0.12, y: y + topH + 0.64, w: w - 0.24, h: h - topH - 0.72, fontSize: 8, color: C.dim, fontFace: "Arial", lineSpacingMultiple: 1.3 });
}

// ================================================================
// SLIDE 1: Cover
// ================================================================
{
  const s = pptx.addSlide();
  darkBg(s);
  addSlideNum(s, 1);
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.04, fill: { color: C.red } });

  s.addText("MAY 2026 · ISSUE 05", {
    x: 0.6, y: 1.0, w: 4, h: 0.3, fontSize: 10, fontFace: "Arial", color: C.dim, letterSpacing: 3,
  });
  s.addText([
    { text: "新闻", options: { fontSize: 56, bold: true, color: C.bright, fontFace: "Arial" } },
    { text: "月报", options: { fontSize: 56, bold: true, color: C.red, fontFace: "Arial" } },
  ], { x: 0.6, y: 1.4, w: 7, h: 1.0 });
  s.addText("航天突破 · AI 变局 · 地缘博弈 · 国内大事 · 产业脉动\n五页速览五月全球要闻", {
    x: 0.6, y: 2.5, w: 5, h: 0.7, fontSize: 14, fontFace: "Arial", color: C.dim, lineSpacingMultiple: 1.6,
  });

  // Right side background image (race_track for atmosphere)
  if (hasImg("race_track")) {
    s.addImage({ path: imgPath("race_track"), x: 5.8, y: 0.3, w: 4.2, h: 3.6, sizing: { type: "cover", w: 4.2, h: 3.6 }, transparency: 75 });
  }

  const hcs = [
    { icon: "🚀", t: "神舟二十三号发射", sub: "首次香港航天员进入太空 · 5月24日", clr: C.red },
    { icon: "🤖", t: "Google I/O 2026", sub: "Gemini Omni 世界模型发布 · 全模态时代开启", clr: C.cyan },
    { icon: "🌏", t: "国际局势动荡", sub: "美伊接近停火 · 美军中导拟常驻日本", clr: C.purple },
  ];
  hcs.forEach((hc, i) => {
    const yy = 1.2 + i * 1.0;
    s.addShape("rect", { x: 6.2, y: yy, w: 3.2, h: 0.82, fill: { color: C.surface }, rectRadius: 0.08, line: { color: C.border, width: 0.5 } });
    s.addShape("ellipse", { x: 6.4, y: yy + 0.14, w: 0.52, h: 0.52, fill: { color: hc.clr, transparency: 85 } });
    s.addText(hc.icon, { x: 6.4, y: yy + 0.14, w: 0.52, h: 0.52, fontSize: 18, align: "center", valign: "middle" });
    s.addText(hc.t, { x: 7.05, y: yy + 0.14, w: 2.2, h: 0.3, fontSize: 12, bold: true, color: C.bright, fontFace: "Arial" });
    s.addText(hc.sub, { x: 7.05, y: yy + 0.44, w: 2.2, h: 0.24, fontSize: 8, color: C.dim, fontFace: "Arial" });
  });

  const badges = [
    { t: "🚀 神舟二十三", c: C.red }, { t: "🤖 Google I/O", c: C.cyan },
    { t: "🌍 美伊博弈", c: C.red }, { t: "⛏ 安全警示", c: C.cyan }, { t: "💰 经济动态", c: C.text },
  ];
  let bx = 0.6;
  badges.forEach(b => {
    const bw = b.t.length * 0.12 + 0.3;
    s.addShape("rect", { x: bx, y: 4.55, w: bw, h: 0.32, fill: { color: C.surface }, rectRadius: 0.16,
      line: { color: b.c === C.text ? C.border : b.c, width: 0.5, transparency: b.c === C.text ? 0 : 60 } });
    s.addText(b.t, { x: bx, y: 4.55, w: bw, h: 0.32, fontSize: 9, color: b.c, bold: true, align: "center", fontFace: "Arial" });
    bx += bw + 0.1;
  });
}

// ================================================================
// SLIDE 2: Aerospace
// ================================================================
{
  const s = pptx.addSlide();
  darkBg(s);
  addSlideNum(s, 2);
  sectionTitle(s, "AEROSPACE", "航天突破 · 星辰大海新篇章", "突破", C.cyan);

  const cw = 2.8, ch = 3.4, gap = 0.22, cx0 = 0.6, cy0 = 1.55;
  card(s, cx0, cy0, cw, ch, "载人航天", C.red, "神舟二十三号成功发射",
    "5月24日23时08分发射升空，乘组由朱杨柱（指令长）、张志远、首位香港航天员黎家盈组成，标志着中国空间站进入国际合作新阶段。",
    "rocket", "2B0508", "🚀");
  card(s, cx0 + cw + gap, cy0, cw, ch, "空间科学", C.cyan, "\"微笑\"卫星实现人类首次",
    "中欧联合研制的SMILE卫星5月19日升空，将首次对地球磁层进行软X射线整体成像，为空间天气预报提供革命性数据支撑。",
    "satellite", "011A20", "🛰");
  card(s, cx0 + (cw + gap) * 2, cy0, cw, ch, "导航产业", C.purple, "北斗产值突破1.33万亿",
    "2025年北斗时空产业总产值达13,323亿元，14亿部智能手机支持北斗定位。逐日工程突破空间太阳能与微波传能核心技术。",
    "navigation", "0A001A", "📡");

  const dpY = 5.05;
  const dps = [
    { num: "23时08分", lbl: "神舟二十三发射时刻", clr: C.red },
    { num: "首次", lbl: "香港航天员飞天", clr: C.cyan },
    { num: "13,323亿", lbl: "北斗产业年度总产值", clr: C.amber },
    { num: "14亿", lbl: "智能手机支持北斗", clr: C.purple },
  ];
  dps.forEach((dp, i) => {
    const dx = 0.6 + i * 2.28;
    s.addShape("rect", { x: dx, y: dpY, w: 2.1, h: 0.52, fill: { color: C.surface }, rectRadius: 0.06, line: { color: C.border, width: 0.5 } });
    s.addText(dp.num, { x: dx, y: dpY + 0.04, w: 2.1, h: 0.28, fontSize: 16, bold: true, color: dp.clr, align: "center", fontFace: "Arial" });
    s.addText(dp.lbl, { x: dx, y: dpY + 0.3, w: 2.1, h: 0.18, fontSize: 7, color: C.dim, align: "center", fontFace: "Arial" });
  });
}

// ================================================================
// SLIDE 3: AI
// ================================================================
{
  const s = pptx.addSlide();
  darkBg(s);
  addSlideNum(s, 3);
  sectionTitle(s, "ARTIFICIAL INTELLIGENCE", "AI 变局 · 全模态时代来临", "变局", C.purple);

  // Feature card
  const fy = 1.55, fh = 1.85, fw = 8.8;
  s.addShape("rect", { x: 0.6, y: fy, w: fw, h: fh, fill: { color: C.surface }, rectRadius: 0.1, line: { color: C.border, width: 0.5 } });

  if (hasImg("ai")) {
    s.addImage({ path: imgPath("ai"), x: 0.6, y: fy, w: 3.5, h: fh, sizing: { type: "cover", w: 3.5, h: fh } });
  } else {
    s.addShape("rect", { x: 0.6, y: fy, w: 3.5, h: fh, fill: { color: "1A1030" } });
    s.addShape("rect", { x: 0.6, y: fy, w: 3.5, h: fh, fill: { color: C.purple, transparency: 85 } });
    const icons = ["🧠","💡","🔮","🌐","⚡","🤖","📊","🔗","🎯"];
    icons.forEach((ic, i) => {
      s.addText(ic, { x: 1.2 + (i % 3) * 1.0, y: fy + 0.35 + Math.floor(i / 3) * 0.55, w: 0.5, h: 0.4, fontSize: 16, align: "center", valign: "middle" });
    });
    s.addText("AI", { x: 1.5, y: fy + 0.4, w: 1.8, h: 1.0, fontSize: 60, bold: true, color: "FFFFFF", transparency: 92, align: "center", fontFace: "Arial" });
  }

  s.addText("Google I/O 2026", { x: 4.3, y: fy + 0.18, w: 2, h: 0.22, fontSize: 8, bold: true, color: C.purple, fontFace: "Arial" });
  s.addText("Gemini Omni：世界模型定义新范式", { x: 4.3, y: fy + 0.42, w: 4.8, h: 0.35, fontSize: 16, bold: true, color: C.bright, fontFace: "Arial" });
  s.addText([
    { text: "Google 发布全模态基座模型，支持文本/图像/音频/视频的全模态输入与输出，具备物理世界理解能力。Gemini 3.5 Flash 推理速度达 ", options: { fontSize: 10, color: C.dim, fontFace: "Arial" } },
    { text: "289 tokens/s", options: { fontSize: 10, bold: true, color: C.cyan, fontFace: "Arial" } },
    { text: "，月活用户突破 ", options: { fontSize: 10, color: C.dim, fontFace: "Arial" } },
    { text: "9 亿", options: { fontSize: 10, bold: true, color: C.amber, fontFace: "Arial" } },
    { text: "。搜索业务迎来25年来最大改版，从关键词匹配转向AI智能体范式。", options: { fontSize: 10, color: C.dim, fontFace: "Arial" } },
  ], { x: 4.3, y: fy + 0.82, w: 4.8, h: 0.82, lineSpacingMultiple: 1.5 });

  // 3 mini cards
  const mcy = 3.62, mch = 1.88, mcw = 2.8, mcgap = 0.2;
  const mcards = [
    { tag: "行业变局", tc: C.cyan, t: "Anthropic 超越 OpenAI", b: "估值达9000亿美元，企业市场份额34.4%首超OpenAI。Karpathy加入预训练团队。OpenAI在新加坡设立海外首个AI实验室。" },
    { tag: "具身智能", tc: C.green, t: "家庭机器人时代开启", b: "首款通用家庭机器人「拾光S1」在武汉发布，可做饭叠衣陪护。2026被业界称为具身智能规模化应用元年。" },
    { tag: "国产力量", tc: C.amber, t: "国内AI多点开花", b: "智谱GLM-5.1高速版400tokens/s；腾讯马维斯AI全平台上线；字节火山剧创1.0缩短制作周期80%。" },
  ];
  mcards.forEach((mc, i) => {
    const mx = 0.6 + i * (mcw + mcgap);
    s.addShape("rect", { x: mx, y: mcy, w: mcw, h: mch, fill: { color: C.surface }, rectRadius: 0.08, line: { color: C.border, width: 0.5 } });
    s.addShape("rect", { x: mx, y: mcy, w: mcw, h: 0.03, fill: { color: mc.tc } });
    s.addText(mc.tag, { x: mx + 0.14, y: mcy + 0.14, w: mcw - 0.28, h: 0.2, fontSize: 8, bold: true, color: mc.tc, fontFace: "Arial" });
    s.addText(mc.t, { x: mx + 0.14, y: mcy + 0.38, w: mcw - 0.28, h: 0.3, fontSize: 13, bold: true, color: C.bright, fontFace: "Arial" });
    s.addText(mc.b, { x: mx + 0.14, y: mcy + 0.72, w: mcw - 0.28, h: 0.98, fontSize: 9, color: C.dim, fontFace: "Arial", lineSpacingMultiple: 1.5 });
  });
}

// ================================================================
// SLIDE 4: Geopolitics & Domestic
// ================================================================
{
  const s = pptx.addSlide();
  darkBg(s);
  addSlideNum(s, 4);
  sectionTitle(s, "GEOPOLITICS & DOMESTIC", "国际局势 · 国内安全警示", "·", C.amber);

  const colY = 1.6;

  function colHeader(s, x, y, w, text, barColor) {
    s.addText(text, { x, y, w, h: 0.3, fontSize: 13, bold: true, color: C.bright, fontFace: "Arial" });
    s.addShape("rect", { x, y: y + 0.04, w: 0.05, h: 0.22, fill: { color: barColor } });
  }
  colHeader(s, 0.6, colY, 3, "国际地缘", C.amber);
  colHeader(s, 5.25, colY, 3, "国内重大事件", C.red);

  const items = [
    [
      { d: "5.24", dc: C.red, t: "美伊接近达成初步停火", b: "巴基斯坦或将宣布谅解备忘录，特朗普称双方\"基本谈成\"。以色列被排除谈判外引发不安。" },
      { d: "5.23", dc: C.red, t: "美军中导系统拟常驻日本", b: "计划在鹿儿岛部署\"堤丰\"系统，中方坚决反对。日本拟向菲律宾出口88式反舰导弹。" },
      { d: "5.19", dc: C.amber, t: "普京访华 · 中俄深化合作", b: "普京对中国进行国事访问，纪念中俄战略伙伴关系30周年，双方同意进一步延长双边条约。" },
      { d: "5月", dc: C.dim, t: "沙特赤字扩大至335亿美元", b: "受伊朗战争冲击，国防开支增长26%，被迫削减\"2030年愿景\"项目。" },
    ],
    [
      { d: "5.22", dc: C.red, t: "山西煤矿爆炸 · 82人遇难", b: "沁源县刘神峪煤矿瓦斯爆炸，247人当班，82死128伤9失踪。涉事高管被刑拘，为十年来最严重矿难。" },
      { d: "5.18", dc: C.red, t: "广西柳州5.2级双震", b: "331年来最强地震，2人死亡，出现岩崩与天坑。应急管理部启动四级应急响应。" },
      { d: "5月初", dc: C.red, t: "湖南浏阳烟花厂爆炸", b: "造成重大伤亡，习近平指示全力救援。应急管理部派工作组赴现场处置。" },
      { d: "5.23", dc: C.amber, t: "台海周边军事动态", b: "台湾防务部门通报16架次军机、8艘军舰在台海活动，13架次越过海峡中线。世卫大会连续10年拒绝涉台提案。" },
    ],
  ];

  [0, 1].forEach(col => {
    const x0 = col === 0 ? 0.6 : 5.25;
    items[col].forEach((ev, i) => {
      const ey = colY + 0.4 + i * 0.94;
      s.addShape("rect", { x: x0, y: ey, w: 4.15, h: 0.8, fill: { color: C.surface }, rectRadius: 0.06, line: { color: C.border, width: 0.5 } });
      s.addShape("rect", { x: x0, y: ey, w: 0.035, h: 0.8, fill: { color: ev.dc } });
      s.addText(ev.d, { x: x0 + 0.16, y: ey + 0.08, w: 0.7, h: 0.22, fontSize: 9, bold: true, color: ev.dc, fontFace: "Arial" });
      s.addText(ev.t, { x: x0 + 0.85, y: ey + 0.08, w: 3.1, h: 0.24, fontSize: 11, bold: true, color: C.bright, fontFace: "Arial" });
      s.addText(ev.b, { x: x0 + 0.85, y: ey + 0.35, w: 3.1, h: 0.38, fontSize: 8, color: C.dim, fontFace: "Arial", lineSpacingMultiple: 1.3 });
    });
  });

  // Bottom background image strip
  if (hasImg("race_start")) {
    s.addImage({ path: imgPath("race_start"), x: 0.6, y: 5.0, w: 8.8, h: 0.55, sizing: { type: "cover", w: 8.8, h: 0.55 }, transparency: 80 });
  }
}

// ================================================================
// SLIDE 5: Economy & Industry
// ================================================================
{
  const s = pptx.addSlide();
  darkBg(s);
  addSlideNum(s, 5);
  sectionTitle(s, "ECONOMY & INDUSTRY", "经济产业 · 复苏与创新", "·", C.cyan);

  // Background images: top-right and bottom-left
  if (hasImg("porsche")) {
    s.addImage({ path: imgPath("porsche"), x: 7.5, y: 0.6, w: 2.5, h: 1.6, sizing: { type: "cover", w: 2.5, h: 1.6 }, transparency: 82 });
  }
  if (hasImg("night_race")) {
    s.addImage({ path: imgPath("night_race"), x: 0.6, y: 4.0, w: 8.8, h: 1.6, sizing: { type: "cover", w: 8.8, h: 1.6 }, transparency: 85 });
  }

  const cards = [
    { icon: "🏦", bg: "001018", clr: C.cyan, t: "央行6000亿MLF操作", num: "6,000亿", sub: "5月25日，央行开展1年期中期借贷便利操作，保持银行体系流动性充裕，维护市场信心。" },
    { icon: "🛍", bg: "180800", clr: C.amber, t: "五一消费创纪录", num: "15.2亿人次", sub: "五一假期跨区域人员流动量同比增3.49%，跨境出行近1130万人次。AI家电销售额同比暴增63%，政府投入625亿超长期国债支持以旧换新。" },
    { icon: "🤖", bg: "080018", clr: C.purple, t: "世界智能产业博览会", num: "260+台", sub: "5月28-31日天津启幕，紧扣\"AI+\"主线，打造\"海陆空\"机器人天团。重庆联合主办，展示新能源汽车与智慧装备。" },
    { icon: "📉", bg: "081808", clr: C.green, t: "2026经济目标", num: "4.5–5%", sub: "GDP增速目标设定为4.5-5%，国防预算增速放缓至7%。杭州法院首例AI替代员工案判赔26万元，引发劳动法热议。" },
  ];

  const scw = 4.2, sch = 1.7;
  cards.forEach((sc, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const sx = 0.6 + col * 4.6;
    const sy = 1.65 + row * 1.94;

    s.addShape("rect", { x: sx, y: sy, w: scw, h: sch, fill: { color: C.surface }, rectRadius: 0.1, line: { color: C.border, width: 0.5 } });
    s.addShape("ellipse", { x: sx + 0.18, y: sy + 0.2, w: 0.55, h: 0.55, fill: { color: sc.bg } });
    s.addText(sc.icon, { x: sx + 0.18, y: sy + 0.2, w: 0.55, h: 0.55, fontSize: 18, align: "center", valign: "middle" });
    s.addShape("ellipse", { x: sx + scw - 0.35, y: sy + 0.16, w: 0.2, h: 0.2, fill: { color: sc.clr, transparency: 60 } });
    s.addText(sc.t, { x: sx + 0.88, y: sy + 0.18, w: 3.1, h: 0.26, fontSize: 12, bold: true, color: C.bright, fontFace: "Arial" });
    s.addText(sc.num, { x: sx + 0.88, y: sy + 0.44, w: 3.1, h: 0.42, fontSize: 26, bold: true, color: sc.clr, fontFace: "Arial" });
    s.addText(sc.sub, { x: sx + 0.18, y: sy + 0.92, w: scw - 0.36, h: 0.65, fontSize: 8.5, color: C.dim, fontFace: "Arial", lineSpacingMultiple: 1.5 });
  });

  // Footer
  s.addShape("rect", { x: 0.6, y: 5.25, w: 8.8, h: 0.3, fill: { color: C.surface }, rectRadius: 0.04, line: { color: C.border, width: 0.5 } });
  s.addText("新闻月报  MAY 2026  |  数据来源：公开新闻报道  ·  仅作信息整理", {
    x: 0.6, y: 5.25, w: 8.8, h: 0.3, fontSize: 8, color: C.dim, align: "center", fontFace: "Arial",
  });
}

// ── Save ──
const outPath = path.join(__dirname, "新闻月报_2026年5月.pptx");
pptx.writeFile({ fileName: outPath })
  .then(() => console.log("DONE: " + outPath))
  .catch(err => console.error("FAIL:", err));
