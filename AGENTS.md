# Clickey — Agent Guide (Single Source of Truth)

本文件是给“大模型/智能体”看的项目唯一执行指南（除 `README.md` 面向人类以外）。

## 强约束（非常重要）

1. **本仓库只维护两份文档**：`README.md`（人类）与 `AGENTS.md`（智能体）。
   - 不要新增 `docs/`、`ROADMAP.md`、`CHECKLIST.md`、看板/验收/任务拆分等散落文档。
   - 需要新增说明时：优先更新本文件相应章节。
2. **架构边界不可打破**：核心逻辑平台无关；原生层最小化；遮罩渲染不抢焦点、不读键盘。
3. **当前阶段“文档与代码并行”**：优先小步迭代；有明确需求时直接落地并同步文档，避免“只写不做”或“只做不记”。

---

## 0. 项目一句话

Clickey 是一个“键盘驱动的分层网格定位”工具：热键激活全屏透明遮罩 → 按键逐层缩小区域 → 自动移动鼠标到区域中心并执行动作。

---

## 1. 历史原型归档（仅参考，不再作为基准）

`demo/` 下保留了版本化 AutoHotkey v1 脚本，用于历史回溯与行为对照；它们**不再**是当前实现的事实标准：

- `demo/clickey_v1.0.ahk`：原 `clickey.ahk`，3x3 方案（多层、键位少）
- `demo/clickey_v1.1.ahk`：原 `clickeyy.ahk`，5x5 方案（层数少、定位更细）
- `demo/clickey_v2.x.ahk` / `demo/clickey_v3.x.ahk`：后续迭代
- **冻结版本**：`demo/clickey_v3.1.ahk`（此后不再迭代）

完整版本说明见 `demo/clickey.md`。当前项目后续迭代以仓库内 Tauri + Rust + Svelte 代码和默认配置为唯一事实来源。

### 1.1 通用交互（以当前默认配置为准）

- 激活：`hotkeys.activation.trigger`（macOS 默认 `Cmd+;`，其他平台默认 `Ctrl+;`，进入 Overlay 时按“`mouse.actionCycle` 顺序里第一个未被 `mouse.disabledActions` 禁用的动作”作为初始动作；默认是左键；Overlay 已激活或正在启动时再次按下会取消当前会话，不执行动作）
- 切换动作：`hotkeys.controls.switchAction`（默认 `Enter`，按 `mouse.actionCycle` 顺序在“未禁用动作”之间循环；默认顺序：左键 -> 右键 -> 中键 -> 仅移动 -> 拖动；左键双击 / Ctrl+左键 / Cmd+左键 / Shift+左键默认禁用）
- 取消：`Esc`（直接退出，不点击）
- 回退：`Backspace`（撤销最近一次按键，恢复上一次 Region）
- 直达：`Space`（直接执行当前 Region 中心点动作，跳过后续层级）
- 拖动：切到 `drag` 后分两段执行；第一次确定起点，第二次确定终点；阶段 2 保留 `Esc` 取消、`Tab` 切屏与 Arrow 微调；若阶段 2 尚未裁剪就按 `Backspace`，回到起点选择
- 切换显示器：`hotkeys.controls.nextMonitor`（默认 `Tab`，多屏时）
- 区域微调：`hotkeys.controls.nudgeUp/Down/Left/Right`（默认 Arrow 四键，步长来自 `nudge.stepPx`，所有层/阶段均可触发）

### 1.2 坐标系与多显示器（当前实现）

- 当前实现初始 Region 取当前显示器（按鼠标当前所在显示器的 `Monitor` 信息判定），多屏可用 `hotkeys.controls.nextMonitor`（默认 `Tab`）轮换。
- v1.x 使用 VirtualScreen（`SysGet` 76~79）作为初始 Region（历史参考）。
- 所有裁剪都发生在“屏幕像素坐标”的 Region 上。
- v3.1 的几何按原始像素绘制，字体按 DPI 缩放，减少多屏 DPI 偏移。

> 智能体在重写/抽取算法时：**计算逻辑与渲染逻辑必须拆开**。核心引擎只在像素坐标里做 Region 变换；渲染层自行处理 DPI 与窗口坐标换算。

---

## 2. 选型（锁定，不要在实现过程中随意改）

### 2.1 Desktop Shell

- **Tauri v2**

### 2.2 UI（配置界面 + 遮罩渲染）

- **Svelte + Vite**
- **TypeScript**
- **Tailwind CSS + shadcn-svelte**
- 遮罩渲染：Canvas 或 SVG（优先 Canvas，便于大量网格绘制）
- Settings 内局部排序交互（当前：鼠标动作循环）使用 **`svelte-dnd-action`**，优先使用库能力而不是继续扩展原生 HTML5 drag。

### 2.2.1 设置页（Settings WebView）

除遮罩外，正式版本提供一个“设置页面”，它本质上是一个**普通 WebView 窗口**（可获取焦点、可交互），用于编辑配置：

- 入口（当前实现）：
  - 托盘左键：切换设置页显隐；Settings 已打开时再次点击会隐藏到托盘。
  - 托盘右键菜单：`设置 / 暂停(或启动) / 退出`。
  - 托盘菜单文案跟随 i18n（`zh-CN` / `en-US`）实时更新。
  - 托盘图标独立于应用图标：应用图标保留底板；托盘使用透明几何图标，运行中显示中心圆点，暂停时隐藏圆点。
- 职责：配置编辑、override JSON 导入导出、热键冲突提示等。
- 边界：设置页不持有业务状态机；只读写配置并触发“应用配置”。

当前实现已具备可发布的表单化设置能力：

- Layer 编辑：增删 / 上下移动 / mode 切换（single/combo）/ 表格化键位直编 / 按层字体大小修改  
  combo 约束：阶段 1（列）固定 `1xN`，阶段 2（行）固定 `Nx1`；single 直接编辑网格单元，combo 在表头/表侧编辑列键与行键
- 热键编辑：activation + controls
- 热键录制：`trigger` / `switchAction` / `nudgeUp/Down/Left/Right` 支持点击录制（Esc 取消、Backspace 清空）
- 通用设置启动项：复选框控制“开机自启动”（默认关闭，变更在下次登录系统生效）与“启动时打开设置页”（默认开启，变更在下次启动生效）；开机自启动场景始终静默常驻托盘，不自动弹出 Settings
- 设置页主题：`跟随系统 / 浅色 / 深色`，仅作用于 Settings WebView
- 配置操作：`导入 / 导出 / 打开目录 / 恢复默认`
- 鼠标行为配置：动作循环与禁用集合（含 `drag`、`doubleLeft`、`ctrlLeft`、`cmdLeft`、`shiftLeft`），以及平滑移动、按压时长、落点随机、速度随机、曲率/抖动、远距离提速与步进策略；关闭“指针平滑移动”时，这组隐藏参数整体不参与执行与校验
- Overlay 样式：alpha/line width/per-layer font size + color picker
- Playground 练习：Settings 内纯前端气泡点击训练区，复用 Core Engine 状态机与当前“最近一次成功应用”的配置，不调用 Native 点击或全局热键
- override JSON：仅包含与默认配置不同字段，支持导入/导出
- 自动生效/Reset：配置改动在校验通过后自动应用并持久化；Reset 恢复默认配置（写入 AppConfig/settings.override.json）

> 遮罩窗口（Overlay）与设置页（Settings）必须是两套不同的窗口策略：Overlay 必须 click-through/不抢焦点；Settings 必须可交互/可聚焦。

### 2.3 Native Layer（Rust）

- 全局热键：`global-hotkey`（候选）
- 鼠标控制：`enigo`（候选）
- 屏幕信息：`display-info`（候选）
- 托盘：Tauri/system tray 能力（最终以 Tauri v2 实际 API 为准）
- 开机自启动：`tauri-plugin-autostart`（当前实现）

> 是否最终采用这些 crate 允许调整，但调整必须在本文件相应章节写明原因与替代方案。

- macOS 发布包执行鼠标移动/点击依赖系统“辅助功能”权限；`tauri dev` 与安装后的 `.app` 是不同的 TCC 身份。智能体在排查“开发态正常、安装态无法点击/无法控制鼠标”时，优先检查安装包是否已单独授权；adhoc 本地签名在重打包后可能需要重新授权。
- macOS 当前全局热键链路（`tauri-plugin-global-shortcut` / `global-hotkey`）对函数键的稳定支持上限为 `F20`；Settings WebView 录制函数键时需兼容 AppKit 私有字符（`NSF*FunctionKey`），但 `F21`~`F24` 不能作为可注册的全局热键。
- macOS 构建入口默认走 `npm run tauri:build`：脚本会优先探测本机签名证书（`Developer ID Application` -> `Apple Distribution` -> `Apple Development`），找不到时显式回退到 `APPLE_SIGNING_IDENTITY="-"`。需要固定证书时优先通过环境变量覆盖，而不是改业务代码。

### 2.4 测试与质量（目标，不一定立即落地）

- Core Engine（TS 纯逻辑）：单测覆盖率目标 **100%**
- Rust：`cargo fmt`、`cargo clippy`、`cargo test`
- 前端：Prettier、ESLint

---

## 3. 架构（边界与职责）

目标分层（禁止跨层“偷懒”）：

1. **Core Engine（TypeScript，纯逻辑）**
   - 输入：按键事件（抽象 KeyCode）、当前状态、当前 Region、配置
   - 输出：下一状态、下一 Region、是否完成、最终点击点
   - 特性：无副作用、可序列化、可单测
2. **Overlay Renderer（Svelte）**
   - 只根据 Runtime State 渲染：网格线、标签、高亮、层级提示
   - 不抢焦点、不读键盘、不修改状态
3. **Settings UI（Svelte，普通 WebView）**
   - 提供配置编辑器（表单/layers/导入导出）与本地 onboarding playground
   - playground 可复用 Core 纯逻辑做教学/练习，但不直接调用鼠标/热键等系统能力
4. **Native Layer（Rust）**
   - 只做系统能力：监听全局热键、读屏幕/DPI/多显示器、执行鼠标移动与点击
   - 不实现网格裁剪/状态机业务逻辑
5. **Desktop Shell（Tauri）**
   - 负责窗口与通信（Overlay/Settings）、托盘菜单、连接 UI/Core/Native
   - 负责把配置下发给 Native（注册热键）与 Core（运行时行为）

---

## 4. 核心概念与术语（统一用词，避免文档与实现分叉）

- **Region**：当前可选区域（像素坐标）
  - `{ x, y, width, height }`
- **Grid**：把 Region 切成 `rows x cols`
- **AppConfig**：单一运行配置对象（包含一组 `layers`），由 Settings 编辑并应用
- **Layer**：一层交互（可能包含多步）
- **Step**：一次按键输入（会把 Region 收缩一次）
- **Mode**
  - `single`：一次按键对应一个 `rows x cols` 网格裁剪
  - `combo`：两段式（先选一维，再选另一维），本质仍是两次裁剪
- **Stage（仅 combo）**
  - 内部状态：Stage 0 / Stage 1（对应配置字段 `stage0` / `stage1`）
  - 设置页显示：阶段 1（列）/ 阶段 2（行）
  - 几何约束：`stage0 = 1xN`（只配列键），`stage1 = Nx1`（只配行键）

---

## 5. 算法规格（可直接转为 Core Engine 代码）

### 5.1 单步裁剪（通用）

给定：

- `currentRegion`
- `rows, cols`
- `keyIndex`（1-based，按键在 keys 列表里的位置）

计算：

- `row = ceil(keyIndex / cols)`
- `col = ((keyIndex - 1) % cols) + 1`
- `cellWidth = currentRegion.width / cols`
- `cellHeight = currentRegion.height / rows`
- 返回新 Region：
  - `x = currentRegion.x + (col - 1) * cellWidth`
  - `y = currentRegion.y + (row - 1) * cellHeight`
  - `width = cellWidth`
  - `height = cellHeight`

点击点（最终输出）：

- `centerX = round(x + width / 2)`
- `centerY = round(y + height / 2)`

### 5.2 默认分层步骤表（历史源于 v3.1）

键位（固定顺序先列后行）：

列键（15）：

- `q a z w s`
- `x e d c r`
- `f v t g b`

行键（15）：

- `y h n u j`
- `m i k , o`
- `l . p ; /`

单键层 3x5：

- `q w e r t`
- `a s d f g`
- `z x c v b`

步骤（共 3 次按键）：

1. combo 阶段 1（内部 stage 0）：用“列键”选列（裁剪一次）
2. combo 阶段 2（内部 stage 1）：用“行键”选行（裁剪一次）
3. single：用单键层 3x5（裁剪一次）

补充：

- 所有层（含 combo 的两个阶段）都支持区域微调（默认 Arrow 四键，步长由 `nudge.stepPx` 控制）。
- 多显示器可用 `hotkeys.controls.nextMonitor`（默认 `Tab`）切换当前屏幕。

### 5.3 v1.0（原 `clickey.ahk` → `demo/clickey_v1.0.ahk`）的“分层步骤表”（历史）

键位：

- 行键（9）：`w e r / s d f / x c v`
- 列键（9）：`u i o / j k l / m , .`

步骤（共 4 次按键）：

1. combo stage 0：用“行键”选 3x3 块（裁剪一次）
2. combo stage 1：用“列键”选块内 3x3（裁剪一次）
3. single：用行键 3x3（裁剪一次）
4. single：用列键 3x3（裁剪一次）

> 注意：v1.0 在 combo stage 0 时，输入允许的是“行键集合”；combo stage 1 时允许的是“列键集合”。

### 5.4 v1.1（原 `clickeyy.ahk` → `demo/clickey_v1.1.ahk`）的“分层步骤表”（历史）

键位 5x5：
`q w e r t / y u i o p / a s d f g / h j k l ; / z x c v b`

步骤（共 3 次按键）：

1. combo stage 0：5x5（裁剪一次）
2. combo stage 1：5x5（裁剪一次）
3. single：5x5（裁剪一次）

### 5.5 Core Engine 状态机规格（E0.2）

目标：把“按键裁剪 + 状态推进 + 撤销/直达/微调”抽象为**纯函数**，可单测、可序列化、与平台无关。

输入（概念）：

- `AppConfig`：包含 `layers[]`、`hotkeys.controls`、`nudge.stepPx`
- `initialRegion`：由 Native 提供的当前显示器 Region（像素坐标；当前显示器按鼠标当前所在显示器判定）
- `key`：单次按键（已被 Native 转为字符串）

输出（概念）：

- `EngineOutput`：`{ state, clickPoint?, didAdvance }`
- `clickPoint` 仅在“完成点击”时返回

状态字段（RuntimeState）：

- `layerIndex`：当前层索引
- `stage`：`combo` 的阶段（0/1）
- `region`：当前可选区域
- `baseRegion`：初始 Region（用于运行时基准与状态重建）
- `history[]`：撤销栈（保存上一步的 `layerIndex/stage/region`）
- `done`：是否结束（退出或完成点击）

核心函数与行为：

1. `createInitialState(config, initialRegion)`
   - `layerIndex = 0`，`stage = 0`
   - `region = initialRegion`，`baseRegion = initialRegion`
   - `history = []`，`done = (config.layers.length === 0)`
2. `getCurrentStep(config, state)`
   - 读取 `config.layers[state.layerIndex]` 作为当前 layer
   - `single`：返回 `{ rows, cols, keys }`
   - `combo`：`stage=0` 返回 `stage0`，`stage=1` 返回 `stage1`
3. `applyKey(config, state, key)`
   - 若 `done=true`：不变更
   - 先做 key 归一化（大小写无关，支持 `Esc/Backspace/Space/Arrow*` 等别名）
   - 控制键来源于 `config.hotkeys.controls.*`（归一化后比较）
   - 控制键规则：`cancel` 结束且不点击；`undo` 在 `history` 为空时结束，否则弹栈恢复 `region/layerIndex/stage`；`directClick` 直接返回 `clickPoint = center(region)` 并结束。
   - 区域微调：按 `hotkeys.controls.nudgeLeft/Right/Up/Down` 触发（支持别名归一化）；步长来自 `config.nudge.stepPx`（非法值回退到 5px）；对所有层/阶段生效；不做 `baseRegion` 边界夹紧。
   - 普通按键：当前 `layer` 不存在时 `done=true`；不在 `keys` 中时不变更；匹配后先写入 `history`，再计算 `nextRegion` 并推进状态，若完成则返回 `clickPoint = center(nextRegion)`。

状态推进规则：

- `combo` 层：`stage 0 -> stage 1`（同层）；`stage 1 -> next layer (stage 0)`
- `single` 层：直接进入 `next layer (stage 0)`
- `done = (layerIndex >= layers.length)`

边界与约束：

- Core 不处理 `nextMonitor` 控制键（默认 `Tab`，切屏由 Native 重新触发 Overlay，并重置初始状态）
- 只有成功裁剪才写入 `history`
- 所有几何运算都在“屏幕像素坐标”中完成

---

## 6. 配置模型（当前实现基线）

> 以下结构与当前实现对齐（以 `src/lib/shared/default-config.json` 为基线）。macOS 运行时会把 `hotkeys.activation.trigger` 的默认值覆写为 `Cmd+;`；其他平台保持 `Ctrl+;`。`app.locale` 的默认值为 `system`，运行时按系统语言解析为当前支持的语言（当前：`zh-CN` / `en-US`）。新增字段时必须同步更新默认配置、前端类型、Rust 结构体与 README/AGENT 文档。

```json
{
  "app": {
    "locale": "system",
    "launchOnLogin": {
      "enabled": false
    },
    "settingsWindow": {
      "openOnLaunch": true,
      "theme": "system"
    }
  },
  "hotkeys": {
    "activation": {
      "trigger": "Ctrl+;"
    },
    "controls": {
      "cancel": "Esc",
      "undo": "Backspace",
      "directClick": "Space",
      "switchAction": "Enter",
      "nextMonitor": "Tab",
      "nudgeLeft": "ArrowLeft",
      "nudgeRight": "ArrowRight",
      "nudgeUp": "ArrowUp",
      "nudgeDown": "ArrowDown"
    }
  },
  "nudge": {
    "stepPx": 5
  },
  "mouse": {
    "actionCycle": [
      "left",
      "right",
      "middle",
      "moveOnly",
      "drag",
      "doubleLeft",
      "ctrlLeft",
      "cmdLeft",
      "shiftLeft"
    ],
    "disabledActions": ["doubleLeft", "ctrlLeft", "cmdLeft", "shiftLeft"],
    "smoothMove": true,
    "moveDurationMs": 120,
    "moveStepMs": 8,
    "pressDurationMs": 24,
    "landingRadiusPx": 1,
    "durationRandomness": 0.24,
    "stepRandomness": 0.22,
    "distanceBoostPx": 1800,
    "durationDistanceBoost": 0.28,
    "stepDistanceBoost": 0.42,
    "curveAlongRatio": 0.08,
    "curveSpreadRatio": 0.12,
    "jitterRatio": 0.01,
    "adaptiveStrideBasePx": 7,
    "adaptiveStrideDistanceRatio": 0.026,
    "adaptiveStrideMaxPx": 42,
    "extraStepsMax": 6,
    "maxSteps": 220,
    "maxStepSleepMs": 24
  },
  "layers": [
    {
      "mode": "combo",
      "stage0": {
        "rows": 1,
        "cols": 15,
        "keys": [
          "q",
          "a",
          "z",
          "w",
          "s",
          "x",
          "e",
          "d",
          "c",
          "r",
          "f",
          "v",
          "t",
          "g",
          "b"
        ]
      },
      "stage1": {
        "rows": 15,
        "cols": 1,
        "keys": [
          "y",
          "h",
          "n",
          "u",
          "j",
          "m",
          "i",
          "k",
          ",",
          "o",
          "l",
          ".",
          "p",
          ";",
          "/"
        ]
      }
    },
    {
      "mode": "single",
      "rows": 3,
      "cols": 5,
      "keys": [
        "q",
        "w",
        "e",
        "r",
        "t",
        "a",
        "s",
        "d",
        "f",
        "g",
        "z",
        "x",
        "c",
        "v",
        "b"
      ]
    }
  ],
  "overlay": {
    "alpha": 120,
    "maskColor": "#000000",
    "lineColor": "#ffffff",
    "textColor": "#ffffff",
    "lineWidthPx": 1,
    "showGrid": true,
    "showDiagonals": true,
    "font": {
      "family": "Segoe UI",
      "sizePx": 12,
      "layerSizePx": [16, 12]
    }
  }
}
```

关键原则：

- **配置是单一事实来源**（UI 只是配置编辑器）。
- Core Engine 只依赖配置与输入事件，不读取 OS。
- **“设置页/托盘”也是配置入口的一部分**：Settings 只负责编辑配置并触发自动应用；不直接参与 Overlay 的事件循环。
- 托盘菜单属于运行时 UI：文案必须与 `app.locale` 解析后的运行时语言同步，交互与设置页行为保持一致。
- `app.launchOnLogin.enabled` 控制“开机自启动”；默认 `false`；变更在下次登录系统生效；自动启动场景始终静默常驻托盘。
- `app.settingsWindow.openOnLaunch` 只影响“应用启动时是否自动显示 Settings”；变更在下次启动生效；关闭后手动启动应用将静默常驻托盘。
- `app.settingsWindow.theme` 仅作用于 Settings WebView；不得影响 Overlay 遮罩窗口的渲染与交互。
- `app.locale` 是语言偏好值：允许 `system/zh-CN/en-US`；当为 `system` 时，由前后端各自按系统语言解析为当前支持的运行时语言（当前：`zh-CN` / `en-US`）。
- macOS 当前期望行为：应用以 agent app（`LSUIElement=1`）方式运行；手动启动时是否自动打开 Settings 由 `app.settingsWindow.openOnLaunch` 控制（默认 `true`）；若由 `app.launchOnLogin.enabled` 触发自动启动，则始终静默常驻托盘；Settings 可见时显示 Dock 图标，关闭设置页（如 `Cmd+W`）后退回“仅托盘常驻”，真正退出（如 `Cmd+Q` / 托盘退出）时托盘也一并消失。
- **层（`layers`）是定制化的单位**：Settings 直接编辑 `layers[]`；Overlay 只消费“当前运行时配置”。
- **combo 层固定为轴向两段式**：`stage0=1xN`（阶段 1，列），`stage1=Nx1`（阶段 2，行）；不支持 `2x15/15x2` 这类双轴 stage。
- **键位输入仅按空白分隔**：`,` 是合法键位本体，不作为分隔符。
- **鼠标策略（`mouse.*`）也是运行时配置的一部分**：不得在 Rust 中硬编码轨迹参数；行为必须由配置驱动并可通过 Settings 调整；当 `mouse.smoothMove=false` 时，从 `moveDurationMs` 起的隐藏字段整体不参与执行与校验。
- **动作顺序（`mouse.actionCycle`）与禁用集合（`mouse.disabledActions`）也是运行时配置的一部分**：`actionCycle` 决定整体顺序，Overlay 只在其中选择“未被禁用的动作”参与切换；允许 `left/right/middle/moveOnly/drag/doubleLeft/ctrlLeft/cmdLeft/shiftLeft`，且至少保留一个未禁用动作；其中 `drag` 为“两段式左键拖动”，先选起点再选终点。
- **持久化采用 override JSON**：仅写入与默认配置不同字段（`AppConfig/settings.override.json`），支持导入/导出同结构 JSON。

---

## 7. 任务拆分（精简版）

我们不维护 100+ 细颗粒任务清单；只保留“可执行、可审阅、可跟踪”的最小任务面板。

### 7.1 Kanban（在本文件更新）

状态定义：

- `Backlog`：未开始
- `In Progress`：智能体执行中
- `Review`：等待人工审阅
- `Done`：审阅通过

### 7.2 当前任务面板

> 更新规则：每次完成一个任务，把它从一个栏目移动到下一个栏目，并同步更新本文件中受影响的当前态描述。

#### Backlog

- （无）

#### In Progress

- （无）

#### Review

- （无）

#### Done

- 激活热键二次按下取消 Overlay（含快速连按注册竞态保护）
- 1.0 发布前文档收口（README 改为对外说明，AGENTS 修正当前态文案并去掉过时描述）
- E0.2 产出 Core Engine 规格（从原型抽象成可测试接口与状态机定义）
- E2 Rust Native PoC（热键/鼠标/屏幕信息在 Windows 可用）
- E0.1 明确 MVP 边界（以 v3.1 作为默认运行基准，先不考虑历史预设）
- E1 初始化 Tauri + Svelte + TS 工程骨架（空壳可跑）
- E3 遮罩窗口 PoC（透明/置顶/click-through/不抢焦点）
- AHK 历史原型归档可用（版本化；冻结于 v3.1）
- 仓库文档收敛为 `README.md` + `AGENTS.md`
- Settings UI 原型完成（层/热键/overlay 表单化 + 配置持久化）
- Settings UI 结构化重构完成（SettingsShell + 5 sections + keepalive 导航 + 自动生效）
- 托盘交互优化完成（左键打开设置；右键菜单“设置/暂停或启动/退出”；菜单文案随 i18n 实时更新）
- 鼠标行为配置化完成（`mouse.*` 全量参数接入 Settings，Native 轨迹/落点/随机策略改为配置驱动）
- macOS 辅助功能权限兜底完成（安装态缺权限时自动打开设置页与系统辅助功能面板，并提示重新授权）
- macOS 打包签名入口完成（自动探测本机证书并支持 `APPLE_SIGNING_IDENTITY` 覆盖；无证书时显式 ad-hoc）
- macOS Dock/托盘生命周期完成（设置页打开时显示 Dock；`Cmd+W` 改为隐藏到托盘；`Cmd+Q` / 托盘退出时真正结束）
- macOS agent 模式启动完成（bundle `Info.plist` 合并 `LSUIElement=1`，Settings 启动显隐由 `app.settingsWindow.openOnLaunch` 控制）
- 鼠标动作顺序/禁用配置完成（`moveOnly` 默认启用；新增 `doubleLeft` / `ctrlLeft` / `cmdLeft` / `shiftLeft` 且默认禁用；Settings 支持统一排序与单独禁用）
- 两段式拖动动作完成（`drag` 接入 `mouse.actionCycle` / `mouse.disabledActions`；Overlay 支持起点/终点两阶段提示与连线预览；Native 执行左键拖动）
- 设置页主题完成（`app.settingsWindow.theme` 支持 `system/light/dark`，仅影响 Settings WebView，并完成样式 token 化）
- 设置页启动行为配置完成（通用设置新增“启动时打开设置页”复选框；默认开启；关闭后改为静默到托盘）
- 开机自启动配置完成（`app.launchOnLogin.enabled` 默认关闭；启用后登录系统时静默常驻托盘，并通过 `tauri-plugin-autostart` 同步系统登录项）
- Settings 气泡点击 playground 完成（纯前端本地练习；复用 Core Engine 与最近一次成功应用的配置；支持命中/撤销/直达/统计）

---

## 8. 审阅清单（精简版）

每次交付（哪怕只是文档）都按以下顺序自检：

1. **一致性**：README 与 AGENT 的说法不矛盾；术语统一；交互与当前实现/默认配置一致。
2. **可执行**：新人能按 README 跑起当前 Tauri 项目；智能体能按 AGENT 找到下一步。
3. **边界清晰**：Core/Native/UI 的职责没有混写。
4. **可回滚**：改动集中、容易 review；不要一次把仓库“重构式大改”。
