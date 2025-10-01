# 番茄时钟 - 专注工作法

一个基于Taro框架开发的番茄工作法应用，帮助用户提高专注力和工作效率。

## 功能特性

### 📱 核心功能
- **今日聚焦** - 查看今日任务概览和统计数据
- **任务管理** - 创建、编辑、删除和管理任务
- **番茄计时** - 25分钟专注时间 + 5分钟休息时间
- **任务量化** - 跟踪任务完成情况和番茄数统计
- **数据统计** - 可视化展示工作效率和趋势

### 🎯 任务管理
- 支持多种任务分类（工作、学习、生活、其他）
- 四级优先级设置（低、中、高、紧急）
- 任务状态跟踪（待办、进行中、已完成）
- 预估番茄数和实际完成数对比

### ⏰ 番茄钟功能
- 标准25分钟专注时间
- 5分钟短休息 / 15分钟长休息
- 可自定义时间设置
- 声音和通知提醒
- 中断次数统计

### 📊 数据统计
- 每日/每周/每月统计报告
- 专注时间趋势图表
- 任务分类分布图
- 完成率和效率分析

## 技术栈

- **框架**: Taro 4.x + React 18
- **语言**: TypeScript
- **样式**: SCSS + CSS Modules
- **状态管理**: Zustand
- **图表**: ECharts
- **UI组件**: NutUI (部分)

## 项目结构

```
src/
├── pages/
│   ├── home/
│   │   ├── index.tsx           # 今日任务页面
│   │   ├── index.scss          # 页面样式
│   │   └── index.config.ts     # 页面配置
│   ├── tasks/
│   │   ├── index.tsx           # 任务管理 & 番茄钟页面
│   │   ├── index.scss
│   │   └── index.config.ts
│   ├── quantify/
│   │   ├── index.tsx           # 任务量化页面
│   │   ├── index.scss
│   │   └── index.config.ts
│   └── stats/
│       ├── index.tsx           # 数据统计页面
│       ├── index.scss
│       └── index.config.ts
├── router/
│   ├── index.ts                # 路由配置入口
│   ├── routes.ts               # 路由定义
│   ├── navigation.ts           # 导航控制函数
│   └── guards.ts               # 路由守卫（如需要）
├── components/
│   ├── StatCard/
│   │   ├── index.tsx           # 统计卡片组件
│   │   └── index.scss
│   ├── TaskCard/
│   │   ├── index.tsx           # 任务卡片组件
│   │   └── index.scss
│   ├── PomodoroTimer/
│   │   ├── index.tsx           # 番茄钟计时器
│   │   └── index.scss
│   ├── Charts/
│   │   ├── TrendChart.tsx      # 趋势图表
│   │   ├── PieChart.tsx        # 饼图
│   │   └── index.scss
│   └── Navigation/
│       ├── TabBar.tsx          # 底部标签栏
│       └── index.scss
├── store/
│   ├── index.ts                # store入口文件
│   ├── taskStore.ts            # 任务状态管理
│   ├── pomodoroStore.ts        # 番茄钟状态管理
│   └── statsStore.ts           # 统计数据状态管理
├── services/
│   ├── api.ts                  # API配置
│   ├── taskService.ts          # 任务相关API
│   └── statsService.ts         # 统计相关API
├── hooks/
│   ├── useTimer.ts             # 计时器Hook
│   ├── useTasks.ts             # 任务管理Hook
│   ├── useStats.ts             # 统计数据Hook
│   └── useNavigation.ts        # 导航Hook
├── utils/
│   ├── date.ts                 # 日期工具函数
│   ├── storage.ts              # 本地存储工具
│   └── constants.ts            # 常量定义
├── types/
│   ├── task.ts                 # 任务相关类型
│   ├── pomodoro.ts             # 番茄钟相关类型
│   ├── stats.ts                # 统计相关类型
│   └── router.ts               # 路由相关类型
├── styles/
│   ├── variables.scss          # SCSS变量
│   └── mixins.scss             # SCSS混入
├── app.tsx                     # 应用入口
├── app.scss                    # 全局样式
└── app.config.ts               # 应用配置
```

## 开发指南

### 环境要求
- Node.js >= 16
- pnpm >= 7

### 安装依赖
```bash
cd tomato-task
pnpm install
```

### 开发命令
```bash
# 微信小程序
pnpm dev:weapp

# H5
pnpm dev:h5

# 支付宝小程序
pnpm dev:alipay

# 字节跳动小程序
pnpm dev:tt
```

### 构建命令
```bash
# 微信小程序
pnpm build:weapp

# H5
pnpm build:h5

# 支付宝小程序
pnpm build:alipay
```

## 使用说明

### 1. 创建任务
1. 进入"任务管理"页面
2. 点击右下角的"+"按钮
3. 填写任务信息（标题、描述、分类、优先级、预计番茄数、计划日期）
4. 点击"创建"保存任务

### 2. 开始专注
1. 在"今日聚焦"页面点击"快速开始"
2. 或在任务卡片上点击"开始"按钮
3. 番茄钟开始计时（默认25分钟）
4. 专注工作，避免中断
5. 时间到后会自动提醒休息

### 3. 查看统计
1. 进入"数据统计"页面
2. 查看专注趋势图表
3. 分析任务分类分布
4. 了解工作效率变化

### 4. 任务量化
1. 进入"任务量化"页面
2. 对比预计番茄数与实际完成数
3. 分析任务估算准确性
4. 优化时间规划能力

## 设计理念

### 番茄工作法原理
- **专注**: 25分钟不间断工作
- **休息**: 5分钟短休息恢复精力
- **循环**: 4个番茄后进行15分钟长休息
- **记录**: 跟踪完成情况和中断次数

### 用户体验
- **简洁直观**: 清晰的界面设计，操作简单
- **数据驱动**: 通过数据了解工作习惯
- **渐进改善**: 持续优化时间管理能力
- **成就感**: 可视化进度激励持续使用

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

### 开发规范
- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier代码规范
- 组件采用函数式组件 + Hooks
- 样式使用SCSS + BEM命名规范

## 许可证

MIT License

## 更新日志

### v1.0.0
- 基础功能实现
- 任务管理系统
- 番茄钟计时器
- 数据统计功能
- 响应式设计支持