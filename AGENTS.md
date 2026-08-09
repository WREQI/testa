# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1 为设计意图与决策上下文。Code agent 实现时以 Section 2 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

- **目标用户**: A股投资者/研究员，高频数据研判场景，需快速识别涨跌信号与技术形态
- **核心目的**: 高效传递行情数据、辅助技术分析与基本面决策
- **情绪基调**: 专业精密 / 克制稳重；避免花哨装饰与视觉噪音干扰数据判读

### 1.2 设计方向

- **Design Style**: Grid 网格 + Dot Matrix 点阵融合 — 金融终端的数据密度与精密感，等宽数字对齐+冷色深底强化专业可信度
- **Application Type**: Professional SaaS Tool（A股分析工作台）— 高信息密度、多面板布局
- **Aesthetic Direction**: 深色炭灰基底上的精密数据仪表盘，强调数字可读性与信号层级

## 2. Color System (色彩系统)

**色彩关系**: 深蓝炭灰主背景 + 冷青灰次级面 + 红涨绿跌语义色 + 金色信号点缀
**配色设计理由**: 深色减少长时间看盘疲劳；红绿符合A股用户心智模型；低饱和蓝灰基底让数据色成为焦点
**主色推导**: primary 取冷青色用于交互控件与图表辅助线，不与涨跌语义色冲突；金色专用于金叉等技术信号标记
**使用比例**: 70% 深色背景 / 20% 卡片与分割面 / 10% 语义色与信号色；primary 仅用于按钮、激活态与关键交互

### 2.1 主题颜色

| Token                | HSL 值            | 说明                          |
| -------------------- | ----------------- | ----------------------------- |
| `background`         | hsl(220 25% 8%)   | 深蓝炭灰页面底色              |
| `card`               | hsl(220 20% 12%)  | 卡片/面板容器背景             |
| `foreground`         | hsl(210 20% 92%)  | 主文字/数据                   |
| `muted-foreground`   | hsl(215 15% 55%)  | 次要标签/说明文字             |
| `primary`            | hsl(195 70% 50%)  | 冷青主交互色（按钮/激活态）   |
| `primary-foreground` | hsl(220 25% 8%)   | 主交互文字                    |
| `accent`             | hsl(220 20% 18%)  | Ghost/hover/focus/skeleton    |
| `accent-foreground`  | hsl(210 20% 85%)  | accent 上的文字               |
| `border`             | hsl(220 15% 20%)  | 分割线与边框                  |

### 2.2 导航区配色

- **基调关系**: 复用主配色系统，导航区使用 `card` 色与内容区分隔
- **关键状态**: 激活态用 `primary` 左侧竖条或底部高亮；hover 用 `accent` 背景
- **边界与背景**: 非透明 `card` 背景；顶栏与内容区间用 `border` 细线分隔

### 2.3 语义颜色

| 用途       | 色相           | Token 建议                     |
| ---------- | -------------- | ------------------------------ |
| 上涨/盈利  | hsl(0 75% 55%) | `semantic-up` / `text-up`     |
| 下跌/亏损  | hsl(145 60% 45%)| `semantic-down` / `text-down` |
| 金叉信号   | hsl(42 90% 55%) | `signal-gold`                 |
| 死叉信号   | hsl(0 0% 50%)   | `signal-gray`                 |
| MA5 均线   | hsl(0 0% 95%)   | 白色                           |
| MA10 均线  | hsl(45 90% 55%) | 黄色                           |
| MA20 均线  | hsl(270 60% 65%)| 紫色                           |
| MA60 均线  | hsl(145 60% 50%)| 绿色                           |

> K线图蜡烛：涨用 `semantic-up` 填充，跌用 `semantic-down` 填充；成交量柱同色映射。所有语义色在深色背景上对比度 ≥ 4.5:1。

## 3. Typography (字体排版)

- **Heading**: Inter, "PingFang SC", "Microsoft YaHei", sans-serif
- **Body**: Inter, "PingFang SC", "Microsoft YaHei", sans-serif
- **Data/Number**: JetBrains Mono, "SF Mono", "Consolas", monospace — 所有价格、涨跌幅、成交量、技术指标数值强制等宽字体，确保列对齐
- **字体策略**: 中文回退 PingFang SC/YaHei；数字与代码专用等宽字体；标题 font-bold，正文 font-normal，数据标签 font-mono text-sm

## 4. Layout Strategy (布局策略)

- **导航意图**: 需持久型顶部导航栏承载搜索+市场概览入口；至多一套全局导航；非透明背景
- **页面架构**: 单工作面高密度布局，详情页K线图为视觉焦点；`max-w-[1400px]` 居中约束
- **响应式**: 移动端隐藏次要指标列，K线图全宽自适应；筛选页表格横向滚动

## 5. Visual Language (视觉语言)

- **形态参数**: 圆角 `rounded-sm (2px)` · 阴影 `shadow-none`（边框分层代替阴影）· 间距基调 `compact (gap-3/p-4)`
- **识别签名**: 所有数值等宽字体右对齐 · 涨跌色背景条标识幅度 · 1px border 分割面板而非阴影
- **装饰策略**: 无装饰图形；仅用网格线、十字光标、信号箭头等功能性视觉元素
- **动效原则**: 即时反馈，100-150ms；K线缩放/切换用 fade 过渡
- **可及性**: 正文对比度 ≥ 4.5:1；涨跌色在深底上已验证达标；交互元素有 focus ring (`ring-primary/50`)

## 6. Component Principles (组件原则)

- **状态完整性**: Button/Input/Select/Tabs 覆盖 Default/Hover/Focus/Disabled；Focus 统一 `ring-2 ring-primary/50 ring-offset-2 ring-offset-background`
- **层级清晰**: Primary 按钮 `bg-primary text-primary-foreground`；Secondary/Ghost 按钮 `bg-accent hover:bg-accent/80`；Tab 激活态底部 `border-b-2 border-primary`
- **一致性**: 表格行高统一 `h-10`；卡片内边距统一 `p-4`；颜色只用 Color System token

## 7. Image Direction (图片与视觉资产)

- **Image Role**: 无强制图片需求
- **Image Art Direction**: 优先通过 K 线图本身、数据排版、信号图标建立视觉记忆点；不使用插画/照片/抽象渐变
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 禁止通用金融素材图、商务人物、科技感光效、无意义装饰插图

## 8. 应避免 (Anti-patterns)

- ❌ 使用紫色渐变、霓虹光效等游戏化视觉，破坏金融工具的专业可信度
- ❌ 涨跌色作为大面积背景使用，仅限数值文字、小标签与K线蜡烛
- ❌ 卡片使用阴影分层，应改用 1px border + 色差区分层级，保持终端质感