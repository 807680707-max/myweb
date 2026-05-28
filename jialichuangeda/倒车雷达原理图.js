/**
 * 倒车雷达 — EasyEDA Pro 独立脚本
 * 基于 BOM 耗材清单 + 电路网表，使用扩展 API 自动生成原理图
 *
 * 用法: EasyEDA Pro → 高级 → 运行脚本 → 粘贴全部 → 点运行
 * 调试: 编辑器 URL 加 ?cll=debug，F12 看控制台
 */
(async () => {
  const log = (msg) => eda.sys_Log.info(`[倒车雷达] ${msg}`);
  const toast = (msg) => eda.sys_ToastMessage.showMessage(msg, 0);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  toast("倒车雷达 原理图生成中...");

  // ═══════════════════════════════════════════════
  // 1. 用 LCSC C 编号从立创库批量查找器件
  // ═══════════════════════════════════════════════
  log("===== 正在查找器件 =====");
  const deviceMap = {};
  const cNumbers = [
    // ── 贴片电源区 ──
    "C2919656", // TYPE-C 2P
    "C84817",   // MT3608
    "C167223",  // 10uH 电感
    "C8678",    // SS34 肖特基
    "C12891",   // 22uF 1206
    "C15849",   // 1uF 0805
    "C91701",   // 22pF 0805
    "C2933144", // 140K 0603
    "C17414",   // 10K 0805
    "C25803",   // 100K 0805
    // ── 直插主电路 ──
    "C398063",  // NE555N DIP-8
    "C725320",  // LM324N DIP-14
    "C405274",  // IR发射管 MHL312IR039CRT
    "C405260",  // IR接收管 MHL324PT03BRT
    "C2895548", // 绿色LED XL-502UGD
    "C2895492", // 红色LED XL-502SURD
    "C2895494", // 红色LED 5mm
    "C402212",  // 1N4148
    "C2760",    // 1uF 电解
    "C5632426", // 100nF 独石
    "C2760861", // 47uF 电解
    "C263190",  // 22pF 瓷片
    "C503219",  // 10uF 电解
    "C713997",  // 1kΩ 1/4W
    "C129921",  // 30kΩ
    "C2903266", // 10kΩ
    "C2857423", // 47kΩ
    "C118911",  // 50kΩ 3296W电位器
    "C2894662", // 1.5kΩ
    "C118936",  // 20kΩ 3296W电位器
    "C2894669", // 200Ω
  ];

  for (const c of cNumbers) {
    try {
      const devs = await eda.lib_Device.getByLcscIds([c]);
      if (devs && devs.length > 0) {
        deviceMap[c] = devs[0];
        log(`  找到 ${c}`);
      } else {
        log(`  ✗ 未找到 ${c}`);
      }
    } catch (e) {
      log(`  ✗ ${c} 查询失败: ${e}`);
    }
  }

  function dev(c) {
    if (!deviceMap[c]) throw new Error(`器件未就绪: ${c}`);
    return deviceMap[c];
  }

  // ═══════════════════════════════════════════════
  // 2. 放置辅助函数
  // ═══════════════════════════════════════════════
  const comps = {}; // designator → component object

  async function put(cNum, designator, x, y, rot = 0) {
    if (!deviceMap[cNum]) {
      log(`跳过 ${designator}: 器件 ${cNum} 未找到`);
      return null;
    }
    try {
      const c = await eda.sch_PrimitiveComponent.create(dev(cNum), x, y, undefined, rot, false, true, true);
      if (!c) { log(`✗ 创建失败: ${designator}`); return null; }
      c.setstate_designator(designator);
      c.setstate_supplier("LCSC");
      c.setstate_supplierid(cNum);
      await c.done();
      comps[designator] = c;
      return c;
    } catch (e) { log(`✗ ${designator}: ${e}`); return null; }
  }

  async function wire(pts, net) {
    try { await eda.sch_PrimitiveWire.create(pts, net); }
    catch (e) { log(`导线异常 [${net}]: ${e}`); }
  }

  async function gnd(x, y) {
    try { await eda.sch_PrimitiveComponent.createNetFlag("Ground", "GND", x, y); }
    catch (e) { /* ignore */ }
  }

  async function pwr(x, y) {
    try { await eda.sch_PrimitiveComponent.createNetFlag("Power", "VCC", x, y); }
    catch (e) { /* ignore */ }
  }

  async function text(content, x, y, fs = 14) {
    try { await eda.sch_PrimitiveText.create(x, y, content, 0, "#333333", null, fs); }
    catch (e) { /* ignore */ }
  }

  // ═══════════════════════════════════════════════
  // 3. 第 1 部分 — 电源升压 (SMD)
  // ═══════════════════════════════════════════════
  log("===== 电源升压 SMD =====");
  await text("【电源升压  MT3608】", -50, 0, 16);

  await put("C2919656", "USB1", 0,   150);  // TYPE-C
  await put("C15849",   "C2",   120,  80);  // 1uF
  await put("C15849",   "C4",   120, 220);  // 1uF
  await put("C25803",   "R3",   120, 310);  // 100K
  await put("C84817",   "U1",   260, 150);  // MT3608
  await put("C167223",  "L1",   260,  40);  // 10uH
  await put("C8678",    "D1",   400,  90);  // SS34
  await put("C2933144", "R1",   400, 230);  // 140K
  await put("C12891",   "C1",   530,  80);  // 22uF
  await put("C12891",   "C3",   530, 230);  // 22uF
  await put("C91701",   "C7",   530, 340);  // 22pF
  await put("C17414",   "R2",   600, 250);  // 10K

  // 升压连线 (简化，NE555用直插部分独立供电)
  await gnd(120, 380);  // USB GND
  await gnd(530, 400);  // 输出 GND
  await pwr(530,  50);  // VCC 输出
  await wait(200);

  // ═══════════════════════════════════════════════
  // 4. 第 2 部分 — NE555 振荡 + 红外发射
  // ═══════════════════════════════════════════════
  log("===== NE555 振荡 & IR 发射 =====");
  await text("【NE555 振荡 & 红外发射】", 0, 470, 16);

  // 布局: NE555 居中，左定时/右输出
  await put("C398063",  "U1_TH", 200, 560);  // NE555
  await put("C2903266", "R1_TH",  70, 490);  // 10K RA
  await put("C129921",  "R4_TH", 340, 490);  // 30K RB
  await put("C2760",    "C1_TH", 200, 700);  // 1uF 定时电容
  await put("C5632426", "C4_TH",  70, 650);  // 100nF 去耦
  await put("C713997",  "R10_TH",340, 600);  // 1K 发射限流
  await put("C405274",  "D3_HF", 460, 560);  // IR 发射管

  // 555 Pin7(DIS)→R1_TH(2)+R4_TH(1)
  await wire([260, 540, 260, 510, 100, 510, 100, 496], "Net_DIS");
  await wire([100, 496, 340, 496], "Net_DIS");
  // 555 Pin2/6(TRIG)→R4_TH(2)+C1_TH(1)
  await wire([220, 540, 220, 520, 370, 520, 370, 496], "Net_TRIG");
  await wire([200, 700, 370, 700, 370, 680], "Net_TRIG");
  // 555 Pin3(OUT)→R10_TH→D3_HF 阳极
  await wire([280, 580, 340, 580, 340, 606], "Net_OUT");
  await wire([410, 606, 460, 606, 460, 566], "Net_OUT");
  // 555 Pin5→C4_TH→GND
  await wire([160, 540, 100, 540, 100, 650, 100, 656], "Net_CV");
  // NE555 Pin4/Pin8→VCC, Pin1→GND
  await pwr(170, 540);
  await gnd(170, 600);
  await gnd( 70, 700);  // C4_TH GND
  await gnd(200, 750);  // C1_TH GND
  await gnd(460, 610);  // D3_HF阴极 GND
  await wait(200);

  // ═══════════════════════════════════════════════
  // 5. 第 3 部分 — IR 接收 + LM324 第一级放大
  // ═══════════════════════════════════════════════
  log("===== IR 接收 & 第一级放大 =====");
  await text("【IR 接收 & 第一级放大】", 0, 800, 16);

  await put("C405260",  "D4_HJ", 150, 880);  // IR接收管
  await put("C2894662", "R15_TH", 60, 850);  // 1.5K 偏置
  await put("C2760",    "C6_TH",  80, 950);  // 1uF 耦合
  await put("C725320",  "U2_TH", 420, 880);  // LM324N
  await put("C2903266", "R3_TH", 250, 800);  // 10K VCC/2上拉
  await put("C2903266", "R19_TH",250, 840);  // 10K 偏置
  await put("C118936",  "RP2",   250, 950);  // 20K 增益调节
  await put("C263190",  "C7_TH", 330, 980);  // 22pF 补偿

  // R15→D4_HJ 偏置
  await wire([60, 856, 150, 856, 150, 876], "Net_IR_BIAS");
  // D4_HJ→C6_TH 耦合
  await wire([150, 894, 150, 920, 80, 920, 80, 956], "Net_IR_SIG");
  // →R3_TH→U2_TH Pin3(OP1A+)
  await wire([80, 956, 420, 956, 420, 870], "Net_OP1A_POS");
  await wire([250, 806, 250, 790, 420, 790, 420, 870], "Net_OP1A_POS"); // R3→VCC/2
  // R19→偏置
  await wire([250, 846, 250, 830, 420, 830], "Net_OP1A_BIAS");
  // OP1A输出 Pin1→RP2+C7反馈→Pin2
  await wire([460, 850, 310, 850, 310, 920, 420, 920, 420, 890], "Net_FB");
  await wire([250, 956, 310, 950, 310, 920], "Net_FB");
  await wire([330, 986, 310, 980, 310, 950], "Net_FB");

  await gnd( 80, 1000);
  await pwr(420, 760);  // LM324 VCC Pin4
  await gnd(420, 920);  // LM324 GND Pin11
  await wait(200);

  // ═══════════════════════════════════════════════
  // 6. 第 4 部分 — 倍压检波
  // ═══════════════════════════════════════════════
  log("===== 倍压检波 =====");
  await text("【倍压检波 & 滤波】", 550, 800, 16);

  await put("C503219",  "C3_TH", 580, 850);  // 10uF 隔直
  await put("C402212",  "D1_TH", 680, 820);  // 1N4148
  await put("C402212",  "D2_TH", 680, 880);  // 1N4148
  await put("C2760",    "C2_TH", 780, 850);  // 1uF 滤波

  // U2 Pin1→C3_TH
  await wire([460, 850, 520, 850, 520, 856, 580, 856], "Net_DETECT");
  // C3_TH→D1+D2 节点
  await wire([620, 856, 680, 856, 680, 826], "Net_DETECT");
  await wire([680, 856, 680, 886], "Net_DETECT");
  // D2→C2_TH→信号总线
  await wire([710, 880, 740, 880, 740, 856, 780, 856], "Net_SIG");
  // D1→GND
  await wire([710, 820, 740, 820, 740, 780, 580, 780], "GND");
  await gnd(620, 780);
  await wait(200);

  // ═══════════════════════════════════════════════
  // 7. 第 5 部分 — 三路比较 + LED 显示
  // ═══════════════════════════════════════════════
  log("===== 比较器 & LED =====");
  await text("【阶梯比较 & LED 指示】", 550, 950, 16);

  // 基准分压链
  await put("C118911",  "RP1",   580, 980);  // 50K 电位器
  await put("C2857423", "R8_TH", 590, 1060); // 47K 串联
  // LED 指示灯 + 限流电阻
  await put("C2895548", "D5_LED", 600, 1150); // 绿
  await put("C2895492", "D6_LED", 700, 1150); // 红粉
  await put("C2895494", "D7_LED", 800, 1150); // 红
  await put("C2894669", "R12_TH", 600, 1070); // 200
  await put("C2894669", "R13_TH", 700, 1070); // 200
  await put("C2894669", "R14_TH", 800, 1070); // 200

  // 信号总线→U2 比较器同相输入端 Pin5/Pin10/Pin12
  await wire([820, 856, 880, 856, 880, 900, 520, 900, 520, 870], "Net_SIG_BUS");

  // 电位器分压→比较器反相输入
  await wire([620, 990, 650, 990, 650, 920, 520, 920, 520, 880], "Net_REF1"); // Pin6
  await wire([620, 1010, 670, 1010, 670, 930, 520, 930], "Net_REF2");           // Pin9
  await wire([620, 1030, 690, 1030, 690, 940, 520, 940], "Net_REF3");           // Pin13

  // 比较器输出→LED 阴极
  await wire([520, 880, 480, 880, 480, 1150, 600, 1150], "Net_LED_G");
  await wire([520, 930, 500, 930, 500, 1150, 700, 1150], "Net_LED_Y");
  await wire([520, 940, 510, 940, 510, 1150, 800, 1150], "Net_LED_R");

  // LED 阳极→限流电阻→VCC
  await wire([600, 1160, 600, 1076], "");
  await wire([700, 1160, 700, 1076], "");
  await wire([800, 1160, 800, 1076], "");
  await wire([600, 1060, 600, 1000, 420, 1000, 420, 760], "VCC");
  await wire([700, 1060, 700, 1020, 420, 1020], "VCC");
  await wire([800, 1060, 800, 1040, 420, 1040], "VCC");

  await gnd(590, 1110);  // 电位器 GND
  await pwr(620, 960);   // 电位器上端
  await wait(200);

  // ═══════════════════════════════════════════════
  // 8. VCC/2 参考电压生成
  // ═══════════════════════════════════════════════
  await put("C2903266", "R5_TH", 420, 730);  // 10K
  await put("C2903266", "R6_TH", 420, 700);  // 10K
  await wire([420, 736, 420, 745], "");       // R5→R6
  await pwr(420, 690);                         // R6→VCC
  await gnd(420, 760);                         // R5→GND

  // ═══════════════════════════════════════════════
  // 9. 完成
  // ═══════════════════════════════════════════════
  log("===== 全部完成! =====");
  toast("倒车雷达原理图生成完成! 请检查并微调布局");
  log("共创建元器件约 40 个");
  log("如果元件重叠，请在画布上手动拖动调整");
})();
