# 人脸通 BS 系统 布局与导航及权限控制详细设计文档（V2-完善版）

| 在 V1 基础上全量保留原文并补齐权限表映射、操作级权限码与角色口径统一内容；原文块以锚点标示，由脚本回填。 |
| --- |

人脸通 BS 系统 布局与导航及权限控制详细设计文档

人脸通 BS 系统项目组

## 目录

- 一、引言与文档说明
- 1.1 编写目的
- 1.2 适用范围与读者对象
- 1.3 术语与缩略语
- 1.4 参考文档与依据
- 1.5 文档约定
- 二、总体设计
- 2.1 设计目标与原则
- 2.2 技术选型
- 2.3 分层架构
- 2.4 工程目录结构
- 2.5 运行时装配
- 2.6 编码与命名约定
- 三、布局详细设计
- 3.1 主框架区域划分
- 3.2 侧边栏设计
- 3.3 顶栏设计
- 3.4 多页签栏设计
- 3.5 内容区与面包屑
- 3.6 登录页布局
- 3.7 主题与样式变量
- 3.8 响应式设计
- 3.9 布局组件清单
- 四、导航详细设计
- 4.1 导航数据模型
- 4.2 九大业务域
- 4.3 菜单规模统计
- 4.4 菜单渲染与交互
- 4.5 菜单派生工具
- 4.6 面包屑
- 4.7 多页签
- 4.8 全局菜单搜索
- 4.9 业务域快速切换
- 五、路由设计
- 5.1 路由组织原则
- 5.2 路由表结构
- 5.3 懒加载与代码分割
- 5.4 重定向与兜底
- 5.5 业务占位页模板
- 六、权限控制设计
- 6.1 权限模型与数据来源
- 6.2 权限码规范
- 6.3 权限匹配算法
- 6.4 会话数据模型
- 6.5 登录与会话建立
- 6.6 菜单级权限控制
- 6.7 页面级权限控制
- 6.8 操作级权限控制
- 6.9 会话失效与错误处理
- 6.10 前后端职责边界
- 6.11 安全约束
- 七、关键流程设计
- 7.1 应用启动与会话恢复
- 7.2 登录流程
- 7.3 菜单导航与页签联动
- 7.4 越权访问处理
- 7.5 退出登录与会话失效
- 7.6 演示登录回退
- 八、状态与存储设计
- 8.1 状态容器
- 8.2 本地存储键设计
- 8.3 请求层设计
- 九、接口与数据约定
- 9.1 前端已约定接口清单
- 9.2 与 CS 数据库及权限表的映射
- 9.3 页面口径中必须保持的硬规则
- 十、设计决策与权衡
- 10.1 关键技术决策
- 10.2 顶栏右对齐缺陷的定位与修复
- 10.3 已知限制与演进方向
- 附录 A 导航—路由—权限码全量对照表
- A.1 工作台
- A.2 卡务中心（5 个分组、29 个页面）
- A.3 消费管理（4 个分组、26 个页面）
- A.4 考勤管理（5 个分组、26 个页面）
- A.5 门禁管理（7 个分组、37 个页面）
- A.6 订餐管理（4 个分组、19 个页面）
- A.7 访客管理（4 个分组、10 个页面）
- A.8 水控/巡更（2 个分组、15 个页面）
- A.9 报表中心（2 个分组、9 个页面）
- A.10 系统管理（3 个分组、16 个页面）
- 附录 B 角色权限矩阵
- 附录 C 演示账号
- 附录 D 文件清单与关键实现位置

# 一、引言与文档说明

本章说明本文档的编写目的、适用范围、术语口径与引用依据。全文描述的设计事实与工程实现 E:\zhimen\2026Ant\PsnMgr(BaiDu) 当前代码一致，凡实现中已经固化并验证过的约束，本文档直接以设计条文形式记录。

## 1.1 编写目的

本文档针对人脸通 BS 一体化管理平台前端的布局与导航、权限控制两部分给出可直接落地的详细设计，用于指导前端开发、后端接口对齐、测试用例设计与后续迭代。

具体目标有四项：一是把主框架（侧边栏、顶栏、多页签、内容区）的区域划分、尺寸口径、交互行为固化为可核对的条文；二是把导航数据结构、九大业务域的三级菜单组织方式、菜单与路由的单一数据源机制说明清楚；三是把权限模型、权限码规范、匹配算法以及菜单级、页面级、操作级三层控制策略完整定义；四是记录本轮设计中的关键决策、已验证的缺陷修复与已知限制，避免后续重复踩坑。

## 1.2 适用范围与读者对象

本文档覆盖 React 前端工程的布局、导航、路由组织与前端权限表现层设计，不覆盖后端接口的内部实现、数据库表结构定义与硬件通讯细节；涉及后端与数据库的部分只描述前端侧的接口约定与依赖关系。

读者对象与关注点如下。

前端开发人员：按第 3 章至第 9 章实现页面、组件与权限逻辑。

后端开发人员：按第 9 章对齐鉴权接口、统一返回体与权限码下发方式。

测试人员：按第 6 章、第 7 章设计权限与流程用例，按第 3 章设计布局与响应式验收点。

项目与产品管理人员：按第 1 章、第 2 章、第 10 章确认范围、技术选型与演进方向。

## 1.3 术语与缩略语

| 术语 | 全称或说明 |
| --- | --- |
| BS | Browser/Server，本项目的浏览器端一体化管理平台，与既有 CS 客户端并行运行 |
| CS | Client/Server，人脸通既有 Windows 客户端系统，本平台与其共用同一套 SQL Server 数据库 |
| 业务域 | 导航树的一级节点，共九个：卡务中心、消费管理、考勤管理、门禁管理、订餐管理、访客管理、水控巡更、报表中心、系统管理 |
| 子功能分组 | 业务域下的二级节点，仅作菜单分组，不可直接跳转，如卡务中心的「人员与组织」 |
| 叶子节点 | 导航树中带路由路径、可直接跳转的最末级节点，对应一个业务页面 |
| 权限码 | 三段式字符串「业务域:资源:操作」，如 card:person:view，是前端权限判定的最小单位 |
| 页签 | 顶栏下方的多页签栏条目，与菜单叶子节点一一对应，同一页面只保留一个页签 |
| 面包屑 | 内容区顶部展示的「业务域 / 子功能分组 / 当前页面」层级导航条 |
| 占位页 | 布局与导航阶段用于承接全部 187 个业务路由的统一页面模板，含查询条件区、数据表格与接口约定 |
| 懒加载 | 通过动态导入按需加载页面模块，主框架先渲染、业务页面后加载 |
| 通配 | 权限码匹配支持全局通配 * 与前缀通配 card:* 两种写法 |
| 演示态 | 开发环境在后端未就绪时使用本地角色与账号的降级登录模式，由环境变量开关控制 |

## 1.4 参考文档与依据

本文档的事实依据分四类，均取自本机真实资料。

| 序号 | 依据 | 用途 |
| --- | --- | --- |
| 1 | 人脸通 BS 系统需求文档 第 4.1 节「布局与导航」、附录 B 映射原则 | 九大业务域划分、三级菜单结构、权限模型与越权返回 403 的约定 |
| 2 | CS 客户端菜单数据 E:\ZhiMen\2026Ant\人脸通需求(禁用)\人脸通菜单.txt | 业务域与子功能名称、菜单规模基线 |
| 3 | CS 安装盘数据库脚本 E:\光盘4.2人脸通\STOneCard_Enp\Bin\SQL | 权限相关表（ST_UserInfo、ST_RoleInfo、ST_RoleRight、ST_RightInfo、ST_MenuInfo 等）与业务表口径 |
| 4 | 已开发 BS 后端 E:\ZhiMen\2026Ant\PsnMgrService(NetCore) | 接口前缀、开发端口与返回体约定 |

## 1.5 文档约定

权限码统一写作「业务域:资源:操作」，字母小写、以英文冒号分隔；业务域与资源两段使用小驼峰（如 dailyDish、cardChange）。

需求编号规则为 BS-模块-序号，模块与序号之间以短横线连接。

路由路径统一以业务域英文键开头，如 /card/person、/system/log/login。

文中出现的尺寸单位为像素（px），仅在样式说明中保留 CSS 变量名与原始单位。

本文档不记录任何真实密码、密钥或支付凭据；演示密码仅在开发环境使用。

# 二、总体设计

## 2.1 设计目标与原则

布局与导航、权限控制两部分共同决定用户「看到什么、能去哪里、能做什么」。设计遵循六条原则。

单一数据源。菜单元数据既定义导航展示，也派生出路由表、面包屑、搜索索引与占位页元信息，避免菜单与路由两处维护、两处走样。

权限前置过滤。菜单在渲染前即按会话权限裁剪，无权限的功能不出现在导航中，而不是先展示再拦截。

三层递进控制。菜单级负责「看不看得见」，页面级负责「进不进得去」，操作级负责「能不能改」。

前端只做展示层控制。前端权限判定用于界面呈现与体验，后端必须对每个业务接口做二次校验，越权访问返回 403。

布局与业务解耦。布局组件只依赖导航数据与会话状态，不感知具体业务；业务页面统一以占位模板承接，后续按需求文档逐页替换。

数据库结构只增不删。前端不直接访问数据库，一律经后端 RESTful API，任何新增表结构不得破坏 CS 既有结构。

## 2.2 技术选型

| 层次 | 选型 | 版本（已安装） | 说明 |
| --- | --- | --- | --- |
| 运行环境 | Node.js / npm | Node 22.22.3 / npm 10.9.8 | 开发与构建环境，依赖源使用 npmmirror 镜像 |
| 框架 | React | 18.3.1 | 函数组件加 Hooks，StrictMode 启动 |
| 语言 | TypeScript | 5.6.3 | 开启 strict、noUnusedLocals、noUnusedParameters |
| 构建 | Vite | 5.4.21 | 路径别名 @ 指向 src，开发端口 5273，/api 代理到后端 |
| UI 组件库 | Ant Design | 5.29.3 | 布局、菜单、页签、表单、表格等全部取自 antd |
| 图标 | @ant-design/icons | 5.6.1 | 菜单图标与顶栏动作图标 |
| 路由 | react-router-dom | 6.30.6 | BrowserRouter 加嵌套路由与懒加载 |
| 请求 | axios | 1.21.0 | 单实例、请求与响应双拦截器 |
| 时间 | dayjs | 最新兼容版本 | 中文 locale，用于工作台日期展示 |
| 后端 | .NET RESTful API | PsnMgrService(NetCore) | 开发期默认 http://localhost:5187 |
| 数据库 | SQL Server | 与 CS 共用实例 | 结构兼容 CS，允许新增、禁止删除 |

前端不引入额外的状态管理库（如 Redux、zustand），会话与多页签状态使用 React Context 承载，依赖面与既有工程 E:\ZhiMen\2026Ant\PsnMgr 保持一致。

## 2.3 分层架构

整体为浏览器端单页应用加分层的后端接口，层次职责如下。

| ┌────────────────────────────────────────────────┐│ 视图层    LoginPage / DashboardPage / ModulePage │├────────────────────────────────────────────────┤│ 布局层    AdminLayout 与 7 个布局组件             │├────────────────────────────────────────────────┤│ 导航层    config/menu 导航树与派生工具            │├────────────────────────────────────────────────┤│ 路由层    router/index + RequireAuth + PermissionGate │├────────────────────────────────────────────────┤│ 状态层    store/auth（会话）+ store/tabs（多页签） │├────────────────────────────────────────────────┤│ 请求层    services/http（axios 实例与拦截器）      │├────────────────────────────────────────────────┤│ 接口层    .NET RESTful API（前缀 /api）           │├────────────────────────────────────────────────┤│ 数据层    SQL Server（与 CS 共用，只增不删）        │└────────────────────────────────────────────────┘ |
| --- |

自上而下的数据流为：用户操作触发路由变化，路由层做登录与权限校验，布局层读取导航数据与会话状态渲染框架，视图层从请求层取业务数据；会话失效由请求层统一抛出事件，状态层清理会话后回到登录页。

## 2.4 工程目录结构

| src/├─ App.tsx                    应用根组件：Provider 装配与主题注入├─ main.tsx                   入口：createRoot 挂载与全局样式引入├─ config/│  ├─ menu.tsx                导航树总装与派生工具（单一数据源）│  ├─ menu/card.tsx           卡务中心菜单定义│  ├─ menu/consume.tsx        消费管理菜单定义│  ├─ menu/attendance-access.tsx  考勤管理与门禁管理菜单定义│  ├─ menu/meal-visitor-utility.tsx  订餐、访客、水控巡更菜单定义│  ├─ menu/report-system.tsx  报表中心与系统管理菜单定义│  └─ roles.ts                角色权限映射与演示账号├─ layouts/│  ├─ AdminLayout.tsx         主框架：侧边栏 / 顶栏 / 多页签 / 内容区│  └─ components/             BrandLogo、SideMenu、HeaderBar、GlobalSearch、UserMenu、AppBreadcrumb、TabsBar├─ router/│  ├─ index.tsx               路由总装：登录路由、鉴权、业务域重定向、叶子路由、403/404│  ├─ RequireAuth.tsx         登录守卫│  └─ PermissionGate.tsx      页面级权限守卫├─ pages/│  ├─ LoginPage.tsx           登录页│  ├─ DashboardPage.tsx       工作台│  ├─ ModulePage.tsx          业务页面占位模板│  ├─ ForbiddenPage.tsx       403 结果页│  └─ NotFoundPage.tsx        404 结果页├─ services/│  ├─ http.ts                 axios 实例、统一返回体处理与拦截器│  └─ auth.ts                 登录、档案、退出登录与演示登录回退├─ store/│  ├─ auth.tsx                会话 Provider 与 useAuth│  └─ tabs.tsx                多页签 Provider 与 useTabs├─ hooks/usePermission.ts     权限判定 Hook├─ utils/│  ├─ permission.ts           权限码匹配与文案转换│  └─ storage.ts              本地存储读写与键名常量├─ styles/│  ├─ global.css              全局样式与 CSS 变量│  └─ theme.ts                Ant Design 主题与品牌常量└─ types/navigation.ts        导航、权限、页签、会话类型定义 |
| --- |

目录划分按职责而非按页面，页面层只放视图组件，导航、权限、请求与状态各有独立目录，便于后续把 187 个业务路由逐页替换为真实业务页面时不动框架代码。

## 2.5 运行时装配

应用根组件的 Provider 嵌套顺序决定了各能力的可见范围，装配顺序与职责如下。

| main.tsx└─ StrictMode   └─ App      └─ ConfigProvider（中文 locale + Ant Design 主题）         └─ AntdApp（全局 message / modal 上下文）            └─ AuthProvider（会话：token、用户、权限码集合）               └─ TabsProvider（多页签：页签集合与关闭策略）                  └─ AppRouter（BrowserRouter + Routes）                     ├─ /login → LoginPage                     └─ RequireAuth                        └─ AdminLayout（主框架）                           ├─ HeaderBar / TabsBar / AppBreadcrumb                           └─ 路由出口 → DashboardPage 或 ModulePage |
| --- |

装配顺序的约束有三点：会话必须早于路由，否则登录守卫读不到登录态；多页签必须早于主框架，否则主框架同步页签时上下文缺失；主题与中文 locale 必须包在最外层，保证登录页与主框架的组件样式一致。

## 2.6 编码与命名约定

| 项目 | 约定 |
| --- | --- |
| 路径别名 | @ 指向 src，跨目录引用一律用别名，不使用多级相对路径 |
| 组件命名 | 布局组件以职责命名（如 SideMenu、TabsBar），页面组件以 Page 结尾 |
| 类型命名 | 接口与类型用 PascalCase（NavNode、SessionUser），常量用大写下划线 |
| 权限码 | 三段式小写，业务域与资源段用小驼峰；变量名为 PermissionCode |
| 本地存储键 | 统一前缀 psnmgr.，键名形如 auth.token、layout.collapsed |
| CSS 类名 | 布局用 BEM 风格前缀 app-，如 app-header、app-header__trigger |
| 事件名 | 全局自定义事件使用 psnmgr: 前缀，如 psnmgr:unauthorized |
| 样式变量 | 颜色与尺寸统一以 CSS 变量暴露在 :root，主题常量同步在 theme.ts |

# 四、导航详细设计

导航采用「业务域—子功能分组—操作页面」三级结构，与需求文档 4.1 节的三级组织原则一致。导航数据集中定义在 config/menu.tsx 与 config/menu/ 目录的五个分域文件中，是菜单、路由、面包屑、搜索与占位页的唯一数据源。

## 4.1 导航数据模型

导航树的节点类型为 NavNode，字段定义与约束如下。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| key | string | 是 | 节点唯一键，全树内不得重复；分组节点须与同层叶子区别命名 |
| label | string | 是 | 菜单显示名称，同时用作面包屑与页签标题 |
| path | string | 否 | 路由路径，仅叶子节点有值；分组节点为空表示不可跳转 |
| icon | 节点 | 否 | 一级业务域图标，由总装文件统一注入 |
| permission | string | 否 | 权限码；叶子节点为页面级权限码，业务域节点为域级查看权限 |
| description | string | 否 | 功能说明，用于占位页描述与菜单提示 |
| children | NavNode 数组 | 否 | 子节点；有子节点即视为分组或业务域 |

除导航节点外，还有三个派生结构：面包屑条目 CrumbItem 含 key、label、path；业务域入口 DomainMeta 含 key、label、icon、permission、description、entryPath；占位页元信息 ModulePageMeta 含 path、title、domain、description、primaryAction、permission。

节点键（key）的取值规则：业务域节点以域英文键命名，如 card、consume；分组节点以「域键-功能英文-group」命名，如 card-account-group；叶子节点以「域键-功能英文」命名，如 card-account。之所以要求分组键与叶子键不得同名，是因为同一菜单树内的键必须全局唯一，否则将触发 React 重复键告警并导致菜单选中态错乱；卡务中心的「账户与卡」分组即按此规则命名为 card-account-group，以区别于叶子节点 card-account。

## 4.2 九大业务域

九个业务域在工作台之下并列，各域的英文键、显示名、图标、域权限码、入口路径、分组与叶子规模如下。

| 业务域 | 键 | 图标 | 域权限码 | 入口路径 | 分组数 | 叶子数 |
| --- | --- | --- | --- | --- | --- | --- |
| 卡务中心 | card | IdcardOutlined | card:view | /card/person | 5 | 29 |
| 消费管理 | consume | ShoppingCartOutlined | consume:view | /consume/area | 4 | 26 |
| 考勤管理 | attendance | ScheduleOutlined | attendance:view | /attendance/account | 5 | 26 |
| 门禁管理 | access | SafetyCertificateOutlined | access:view | /access/controller | 7 | 37 |
| 订餐管理 | meal | CoffeeOutlined | meal:view | /meal/param | 4 | 19 |
| 访客管理 | visitor | TeamOutlined | visitor:view | /visitor/apply | 4 | 10 |
| 水控/巡更 | utility | ThunderboltOutlined | utility:view | /utility/water/card-type | 2 | 15 |
| 报表中心 | report | BarChartOutlined | report:view | /report/overview | 2 | 9 |
| 系统管理 | system | SettingOutlined | system:view | /system/operator | 3 | 16 |

工作台为独立一级节点，权限码 dashboard:view，路径 /dashboard，所有角色默认可见，且是页签体系的兜底回退目标。

## 4.3 菜单规模统计

| 统计项 | 数量 | 口径 |
| --- | --- | --- |
| 菜单节点总数 | 233 | 工作台 1 加九个业务域 9 加分组 36 加叶子 187 加 0 |
| 业务域节点 | 9 | 层级一，带图标，不可直接跳转 |
| 分组节点 | 36 | 层级二，仅作分组与菜单折叠 |
| 叶子节点 | 187 | 层级三，全部带路由路径与页面级权限码 |
| 可路由路径 | 188 | 187 个业务页面加工作台 |
| 权限码字面量 | 197 | 187 个叶子权限码加 9 个域权限码加工作台权限码 |
| 非叶节点合计 | 45 | 9 个业务域加 36 个分组 |
| 无权限码的节点 | 36 | 全部为分组节点，权限由子节点与域权限共同决定 |

统计口径说明：节点总数按深度优先展开整棵树计算，包含工作台；叶子数按「无子节点的节点」计算；权限码字面量按配置文件中出现 permission 字段的次数计算，不含运行期由域键推导的兜底值。

## 4.4 菜单渲染与交互

菜单渲染由 SideMenu 组件承担，输入为过滤后的导航树、折叠状态与筛选关键词，输出为深色主题的 antd Menu。

层级与样式：使用 inline 模式与深色主题，展开态宽度 240、折叠态 64，条目高度 40，图标尺寸 16；分组标题不可点击跳转，只控制展开收起。

选中态：选中键取当前路径对应的叶子节点键，由路径反查得到，不使用路径本身作为键，避免与分组键混淆。

展开态：受控的 openKeys 取当前路径的父级链路键，配合用户手动展开或收起；路径变化时自动同步为当前页面的父级链路。

筛选：关键词非空时，按菜单名称与路径做包含匹配，过滤后仅保留命中的叶子及其父级；筛选框仅在展开态渲染，选中叶子后自动清空。

折叠态：折叠时隐藏文字，通过弹出层展示子菜单；折叠状态持久化，刷新后恢复。

## 4.5 菜单派生工具

导航树派生的全部工具函数集中在 config/menu.tsx，职责与被调用方如下。

| 函数 | 职责 | 主要调用方 |
| --- | --- | --- |
| flattenMenu | 深度优先展开整棵树的全部节点 | 路径查找 |
| flattenLeaves | 只展开无子节点的叶子节点 | 域入口定位、路由生成 |
| findNodeByPath | 按路径精确查找节点 | 页签标题与业务域 |
| getMenuTrail | 返回从业务域到当前节点的完整链路 | 面包屑、开放键、搜索索引 |
| getDomainOf | 取链路首节点，即当前路径所属业务域 | 页签业务域标签 |
| getBreadcrumbs | 链路转面包屑条目 | 内容区面包屑 |
| getOpenKeys | 链路去掉末节点，得需展开的父级键 | 菜单展开态同步 |
| filterMenuByPermission | 递归按权限过滤，子项全被过滤则隐藏父节点 | 布局层菜单与业务域入口 |
| buildDomainEntries | 生成业务域入口信息与可见域列表 | 顶栏业务域切换 |
| getModulePageMeta | 生成占位页元信息与主操作文案 | 业务占位页 |
| buildMenuSearchIndex | 生成可跳转节点的路径、名称、业务域与链路索引 | 全局搜索 |

## 4.6 面包屑

面包屑位于内容区顶部，数据由当前路径反查导航链路生成，条目顺序为「业务域 / 子功能分组 / 当前页面」，当页面直接挂在业务域下时链路为两级。

交互约定：首项固定为「首页」并链接到工作台，用于在任意深度快速回到起点；中间项展示层级名称但不提供跳转（分组节点本身无路径）；末项为当前页面，以次要文字颜色显示且不可点击。当路径不属于导航树（如 403 与 404 页面）时，面包屑退化为仅「首页」一项。

## 4.7 多页签

多页签由 store/tabs.tsx 的上下文管理，主框架在路由变化时自动开页签。页签数据结构为 key、path、title、domain、closable 五个字段。

| 操作 | 行为 |
| --- | --- |
| 打开 | 按路径查导航节点，若页签已存在则只更新标题与业务域，否则追加到末尾并置为激活 |
| 关闭 | 关闭非激活页签直接移除；关闭激活页签时按「右侧相邻、左侧相邻、工作台」顺序回退 |
| 关闭其他 | 只保留当前页签与不可关闭的工作台页签 |
| 关闭全部 | 清空为仅剩工作台页签并跳转工作台 |
| 刷新 | 以 replace 方式重新进入当前路径，不新增页签 |
| 工作台 | 固定存在、不可关闭，作为所有回退路径的终点 |

页签与菜单的双向联动：点击菜单叶子开页签并导航；点击页签导航到其路径，菜单选中态随之更新；关闭当前页签后导航到回退目标，菜单与面包屑同步刷新。激活页签的状态由当前路径推导，页签本身不保存「当前选中」字段，避免双份状态不一致。

## 4.8 全局菜单搜索

顶栏的全局搜索用于在 233 个节点中快速定位页面，索引由 buildMenuSearchIndex 在应用启动时生成一次，供整个会话复用。

索引记录四个字段：路径、菜单名称、所属业务域、层级链路（以斜线连接的「业务域 / 分组 / 页面」字符串）。搜索时对名称与链路做忽略大小写的包含匹配，按链路层级数升序取前 8 条展示，每条候选展示「页面名称 + 链路」，点击后跳转对应路径并自动开页签、清空关键词。输入框失焦后延时 180 毫秒收起候选面板，以免点击候选时因失焦先行关闭而丢失点击事件。

## 4.9 业务域快速切换

顶栏的业务域切换用于在九个业务域之间快速跳转，其数据由 buildDomainEntries 生成：过滤掉工作台节点，对每个业务域取其第一个叶子节点的路径作为入口路径。

可见性规则：下拉中只列出经权限过滤后仍有可见节点的业务域，避免展示完全无权限的域。当前域定位规则：遍历可见域，按「当前路径以斜线加域键开头」判断，第一个命中者即为当前域，并在触发器上显示域名称与图标。切换行为：点击某个域即导航到该域入口路径，并自动展开侧边栏对应域、开页签。

# 五、路由设计

## 5.1 路由组织原则

路由表不是手写的清单，而是由导航树在运行时派生，遵循三条原则。

单一数据源。路径、页面标题与页面权限码全部来自导航叶子节点，路由文件只负责装配守卫、懒加载与兜底，不重复声明业务路径。

守卫分层。登录守卫（RequireAuth）包在主框架外层，权限守卫（PermissionGate）包在每条叶子路由外层，两者职责不重叠。

逐条懒加载。每个业务页面单独分包，每个路由独立 Suspense，切换页面不卸载主框架。

## 5.2 路由表结构

| 路径模式 | 类型 | 守卫 | 目标 | 说明 |
| --- | --- | --- | --- | --- |
| /login | 公开路由 | 无 | LoginPage | 已登录时仍可访问，用于切换账号 |
| / | 重定向 | 无 | 转为 /dashboard | 以 replace 方式跳转 |
| /dashboard | 叶子路由 | RequireAuth 加 PermissionGate | DashboardPage | 权限码 dashboard:view，页签不可关闭 |
| /各业务域键 | 重定向 | RequireAuth | 转为该域首个叶子的路径 | 以 replace 方式跳转，如 /card 转 /card/person |
| /各叶子路径 | 叶子路由 | RequireAuth 加 PermissionGate | ModulePage | 共 187 条，权限码取节点自身 |
| /403 | 结果页 | RequireAuth | ForbiddenPage | 支持查询参数 from 与 required，用于展示来源与所需权限 |
| 其他任意路径 | 兜底 | 无 | NotFoundPage | 404 结果页 |

装配方式为：RequireAuth 包裹 AdminLayout，AdminLayout 作为父路由承载主框架并提供路由出口；域重定向路由与叶子路由作为 AdminLayout 的子路由声明；403 与 404 同样位于主框架内，保证异常页面也保留侧边栏与页签导航，用户可以一键返回业务页面。

## 5.3 懒加载与代码分割

业务页面统一使用动态导入加 React.lazy：模块加载期间展示居中的加载指示器与「页面加载中…」文案，该加载态位于路由出口内部，因此主框架与侧边栏保持挂载、不出现整屏闪烁。

每个路由使用独立的 Suspense 边界，任一页面分包加载失败或渲染异常都不会连带卸载主框架。构建产物按依赖分包，主要分块如下（以首次交付构建为例）。

| 分块 | 体积 | 内容 |
| --- | --- | --- |
| vendor-antd | 1173.14 kB | Ant Design 与图标库 |
| index | 110.88 kB | 应用框架、布局、导航、路由、状态与请求层 |
| vendor-react | 20.83 kB | React、React DOM 与路由运行时 |
| DashboardPage | 4.46 kB | 工作台页面 |
| ModulePage | 3.85 kB | 业务占位页模板 |
| LoginPage | 2.83 kB | 登录页 |

首次生产构建共 3128 个模块，构建耗时约 19.5 秒（本机 Node 22.22.3 环境实测）。分包策略把体积最大的组件库单独成块，业务页面按需增量加载，避免每次进入都重复下载框架代码。

## 5.4 重定向与兜底

| 场景 | 处理 |
| --- | --- |
| 访问根路径 | 重定向到工作台 |
| 访问业务域根路径 | 重定向到该域第一个叶子页面，保持用户直觉上「进入该域」的预期 |
| 未登录访问受保护路径 | 跳转登录页，并在路由状态中记录来源路径，登录成功后回跳来源 |
| 已登录但无页面权限 | 由权限守卫在路由出口内渲染 403 结果页，保留主框架 |
| 路径不存在 | 渲染 404 结果页，提供返回工作台入口 |
| 会话失效 | 请求层抛出未授权事件，清会话后跳登录页并携带来源路径 |

## 5.5 业务占位页模板

187 个叶子路由在布局与导航阶段统一指向 ModulePage，页面元信息由 getModulePageMeta 从导航节点派生，包含路径、标题、所属业务域、功能描述、主操作文案与权限码。

页面结构自下而上分四部分：页面头部展示标题与描述，右侧为主操作按钮；查询条件区提供关键词输入、状态选择、日期范围与查询重置按钮；数据表格区展示列配置与分页；底部为接口约定提示，标明该页面待接入的接口与数据表口径。

两处派生规则值得注意。一是主操作文案：当页面名称命中「报表、明细、汇总、记录、日志、流水、查询」等词时，主操作显示为「导出数据」，否则显示为「新增加页面名」。二是操作权限派生：页面内的「查看」按钮权限为「资源段加 :view」，据此推导出「资源段加 :edit」控制「编辑」按钮的可用性，从而在页面尚未接入真实业务前，就能验证操作级权限的生效情况。

占位页的定位是承接路由与权限验证，后续按需求文档逐页替换为真实业务页面时，只替换页面组件，路由、菜单、面包屑、页签与权限判定均不需要改动。

# 六、权限控制设计

## 6.1 权限模型与数据来源

权限模型为「用户—角色—权限码集合」：用户登录后由后端下发会话用户对象，其中包含角色编号、角色名称与权限码集合；前端以权限码集合为唯一判定依据，不感知角色本身，角色只在展示层用于显示标签。

权限来源链路：CS 系统已有的权限表（操作员 ST_UserInfo、角色 ST_RoleInfo、角色权限 ST_RoleRight、权限项 ST_RightInfo、菜单权限 ST_MenuInfo、部门数据权限 ST_DeptRight、机台权限 ST_MOCRight）由 BS 后端读取并映射为权限码集合，经档案接口下发到前端。正式部署时前端不做任何权限硬编码；当前工程内置的六个演示角色仅用于开发环境的后端未就绪阶段。

## 6.2 权限码规范

权限码为三段式字符串，格式为「业务域:资源:操作」，三段均小写、以英文冒号分隔，业务域与资源段使用小驼峰。

| 段位 | 含义 | 示例 |
| --- | --- | --- |
| 业务域 | 九大业务域键或 dashboard | card、consume、attendance、system |
| 资源 | 具体功能对象，叶子级功能以功能英文名命名 | person、dailyDish、cardChange、log |
| 操作 | 动作类型，查看类统一为 view，报表类使用报表动作名 | view、normal、cashier、roster |

命名细则：页面级权限码统一以 :view 结尾（报表类页面按报表用途命名，如 card:report:cashier、consume:report:normal）；业务域节点使用「域:view」作为域级可见权限；字典类分组不设权限码，其可见性由子节点的过滤结果决定。

通配规则支持两级：全局通配「星号」表示拥有全部权限，用于系统管理员；前缀通配「域:星号」表示拥有该业务域下的全部权限，用于卡务出纳、安保等整域授权的角色。前缀通配可递归到任意段，如 consume:record:星号 表示消费流水的全部操作。

## 6.3 权限匹配算法

匹配逻辑集中在 utils/permission.ts，核心函数为 hasPermission，实现如下。

| function hasPermission(permissions, required) {  if (!required) return true;                       // 未声明权限要求视为公开  if (!permissions \|\| permissions.length === 0) return false;  return permissions.some(function (grant) {    if (grant === '*') return true;                                     // 全局通配    if (grant === required) return true;                                 // 精确匹配    if (grant.endsWith(':*') && required.startsWith(grant.slice(0, -1))) return true;  // 前缀通配    return false;  });} |
| --- |

三条判定规则与顺序不可调整：先判空要求（无要求即通过），再判空集合（无权限即拒绝），最后按精确匹配、全局通配、前缀通配依次判定。前缀通配的实现方式是去掉授权码末尾的冒号与星号，再判断所需权限是否以其为前缀，因此 card:星号 能命中 card:person:view，而 card:person 不能命中 card:person:view。

配套还有两个函数：hasAnyPermission 用于「任一命中即通过」的场景（如同时具备查看与导出权限才展示导出按钮的弱化场景）；describePermission 用于把权限码中的冒号替换为间隔号，生成面向用户的可读文案，供 403 页面展示所需权限。

## 6.4 会话数据模型

会话用户对象包含八个字段。

| 字段 | 说明 |
| --- | --- |
| userId | 用户主键，演示态以 U 加账号大写构造，正式态取 CS 操作员编号 |
| userName | 登录账号 |
| displayName | 显示姓名 |
| roleNo | 角色编号 |
| roleName | 角色名称，用于顶栏角色标签 |
| deptName | 所属部门 |
| permissions | 权限码集合，前端权限判定的唯一依据 |

登录态判定只依据令牌是否存在（isAuthenticated 等价于令牌非空），不做令牌有效期解析；令牌失效由后端返回 401 触发前端清理。

## 6.5 登录与会话建立

登录流程分四步：提交账号密码到登录接口；接口返回统一返回体，状态码属于成功集合时取其中的令牌与用户；写入会话上下文并持久化到本地存储；按来源路径回跳或进入工作台。

登录接口请求与响应约定：请求体含账号（userName）与密码（password）；响应体数据部分含令牌（token）与用户对象（user）。前端在登录成功后提示「欢迎回来，姓名（角色名）」，密码字段不做本地留存，勾选记住账号时只记录账号名。

## 6.6 菜单级权限控制

菜单级控制的目标是「无权限的功能不出现在导航中」，由 filterMenuByPermission 实现，规则有三条。

叶子节点：声明了权限码的，仅在权限集合命中时保留；未声明权限码的，视为公开并保留（当前导航树中所有 187 个叶子均声明了权限码）。

分组节点：递归过滤子节点后，若子节点全部被过滤则整个分组不渲染，避免出现空分组。

业务域节点：同样按子节点过滤结果决定去留，因此无任何可见页面的业务域不出现在侧边栏，也不出现在顶栏的业务域下拉中。

过滤结果同时驱动侧边栏菜单、顶栏业务域下拉与菜单搜索索引，三处使用同一份过滤后的树，保证「看得到的一定能进、看不到的一定进不去」。

## 6.7 页面级权限控制

页面级控制防止用户通过直接输入地址越权访问，由 PermissionGate 实现：包裹在每条叶子路由外层，读取当前路径对应的叶子节点权限码，命中则渲染子路由，未命中则渲染内嵌的 403 结果页，并保留主框架与页签。

403 结果页接收两个可选参数：来源路径（from）与所需权限码（required），页面据此展示「你当前的账号（角色名）没有访问该页面的权限」，并提示所需权限与可联系的管理员；若带有来源参数，页面提供「返回上一页」入口，否则提供「返回工作台」。

菜单级与页面级的关系是「入口安全」与「直连安全」：菜单级让无权限功能不可见，页面级兜住手工输入地址、书签、外部链接等直连场景。两者必须同时存在，缺一不可。

## 6.8 操作级权限控制

操作级控制决定页面内按钮与批量动作的可用性，规范如下。

权限码派生：资源的查看权限为「资源:view」，据此派生「资源:edit」控制编辑类操作；报表类页面派生「资源:export」控制导出。

组件级封装：页面通过 usePermission 钩子取得判定函数与权限集合，按需控制按钮的显示与禁用；权限不足时优先隐藏而非置灰，避免暴露无权限功能的存在。

页面级入口：登录页、403 与 404 页面不参与操作级判定；工作台快捷入口按各自所需权限过滤后渲染。

批量操作：批量删除、批量下发等高风险动作在权限判定之外，还需二次确认弹窗与操作日志留痕，两者缺一不可。

### 6.8.1 操作级权限码派生清单（V2 补充）

本节补全操作级权限码的派生规则与各业务域典型操作码，作为按钮级权限判定与后端接口鉴权的共同依据。派生规则：以「资源:view」为基线，按动作追加后缀——:edit 编辑类（新增/修改）、:delete 删除、:import 导入、:export 导出、:audit 审核类、:dispatch 下发类、:cashier 出纳资金类、:batch 批量类。

各业务域典型操作权限码：

| **业务域** | **资源示例** | **操作码集合** | **说明** |
| --- | --- | --- | --- |
| **card****（卡务）** | **person** | **card:person:view / :edit / :delete / :import / :export** | **人员档案增删改查导入导出** |
| **card** | **dept** | **card:dept:view / :edit** | **部门档案** |
| **card** | **face** | **card:face:view / :edit / :dispatch** | **人脸照片库与特征下发** |
| **card** | **account** | **card:account:view / ****:edit / :cashier** | **账户与卡业务** |
| **card** | **recharge** | **card:recharge:cashier / :audit** | **充值入账、退款审核** |
| **card** | **supply** | **card:supply:batch / :cashier** | **补贴批量发放** |
| **consume****（消费）** | **record** | **consume:record:view / :export / :edit** | **流水查询与纠错** |
| **consume** | **correct** | **consume:correct:audit** | **纠错审核（高风险）** |
| **consume** | **terminal** | **consume:terminal:view / :edit / :dispatch** | **终端参数与键值下发** |
| **attendance****（考勤）** | **roster** | **attendance:roster:view / :edit / :batch** | **排班** |
| **attendance** | **leave** | **attendance:leave:view / :audit** | **请假审批** |
| **attendance** | **daily** | **attendance:daily:view / :edit** | **每日考勤与人工调整** |
| **access****（门禁）** | **door** | **access:door:view / :edit** | **门与控制器** |
| **access** | **right** | **access:right:view / :edit / :dispatch** | **门权限授权与下发** |
| **access** | **remote** | **access:remote:control** | **远程开门****/****常开常闭（需二次确认）** |
| **meal****（订餐）** | **order** | **meal:order:view / :edit / :refund** | **订餐与退订** |
| **meal** | **rule** | **meal:rule:view / ****:edit** | **订餐规则** |
| **visitor****（访客）** | **apply** | **visitor:apply:view / :audit** | **预约审批** |
| **visitor** | **record** | **visitor:record:view / :export** | **来访记录** |
| **report****（报表）** | **各综合报表** | **report:<****名称****>:view / :export** | **报表类以报表用途命名，见**** 6.2** |
| **system****（系统）** | **log** | **system:log:view / :export** | **日志只读，禁止**** :edit/:delete** |
| **system** | **user / role** | **system:user:view / :edit****、****system:role:view / :edit** | **操作员与角色管理** |
| **system** | **param** | **system:param:view / :edit** | **系统参数与字典** |

约束：日志类资源不派生编辑与删除操作码（对应需求文档 6.7"日志不可被普通角色修改或删除"）；资金类（:cashier）与下发类（:dispatch）、远程控制（access:remote:control）为高风险操作码，除权限判定外还需二次确认弹窗与操作日志留痕（与本节批量操作条款一致）；后端对每个业务接口按本清单独立鉴权，前端不得以隐藏按钮替代后端校验（见 6.10）。

## 6.9 会话失效与错误处理

请求层对鉴权相关状态码做统一处理，页面层不重复判断。

| 状态 | 触发条件 | 前端处理 | 用户可见提示 |
| --- | --- | --- | --- |
| 401 未授权 | 令牌缺失、过期或被后端拒绝 | 清理会话与本地存储，派发全局未授权事件，跳转登录页并记录来源路径 | 登录状态已失效，请重新登录 |
| 403 无权限 | 已登录但接口或页面越权 | 页面级由权限守卫渲染 403 结果页；接口级由请求层抛出异常给页面展示 | 无权限访问该资源 |
| 登录失败 | 账号或密码错误 | 停留在登录页，保留已填账号 | 账号或密码错误，请重试 |
| 响应异常 | 返回体缺少必要字段或状态码非成功集合 | 按接口异常抛出 | 服务返回异常，请稍后重试 |
| 网络异常 | 超时、断网、跨域或服务未启动 | 按网络异常抛出 | 网络异常或服务不可用 |

未授权事件采用浏览器全局自定义事件机制（事件名 psnmgr:unauthorized），由会话上下文统一监听，保证任何位置的接口调用都能触发一次且仅一次会话清理，避免多组件各自跳转导致的路由抖动。

## 6.10 前后端职责边界

前端权限控制只承担表现层职责，安全底线在后端。约定如下。

后端必须对每个业务接口做独立鉴权，不得依赖前端传入的角色或权限信息。

越权访问返回 403 且不返回任何业务数据，避免通过错误信息泄露数据结构。

前端传入的用户身份一律以令牌为准，接口不接受前端声明的角色编号。

数据范围权限（本人、本部门、本机台、全部）由后端按 CS 的部门权限与机台权限表执行，前端不做数据裁剪。

## 6.11 安全约束

密码不落地：前端不存储密码，登录请求后即丢弃；演示密码常量仅存在于开发环境代码中，生产构建的演示登录开关关闭。

令牌存储：令牌与会话用户保存在本地存储（键 psnmgr.auth.token 与 psnmgr.auth.user），并在每次请求的 Authorization 头中以 Bearer 形式携带。

敏感信息：文档、日志与本地存储中不得出现支付密钥、短信密钥、数据库连接串等凭据。

审计要求：登录、退出、越权访问与高风险操作均需在后端留痕，前端不提供绕过审计的入口。

# 七、关键流程设计

## 7.1 应用启动与会话恢复

启动顺序固定为：入口挂载根组件、注入主题与中文语言包、初始化会话上下文、初始化多页签上下文、装配路由、按当前地址匹配路由。

会话恢复在一次同步读取中完成：会话上下文从本地存储读取令牌与会话用户，若两者均存在则直接置为已登录状态，避免首屏先渲染登录页再跳回的闪烁。多页签初始状态只有一个不可关闭的工作台页签，当前地址对应的页签由主框架在首次渲染时自动补开。

守卫判定顺序为：请求受保护路径时先过登录守卫，未登录则跳登录页并记录来源；已登录时由主框架渲染布局，再由页面级权限守卫判定当前页面的权限码，通过则渲染业务页面，否则渲染 403 结果页。

## 7.2 登录流程

用户        登录页        会话上下文       请求层          后端 │ 输入账号密码 │              │             │              │ │────────────▶│              │             │              │ │             │ 提交登录      │             │              │ │             │─────────────▶│ 调用登录接口  │              │ │             │              │────────────▶│  POST /auth/login │             │              │             │─────────────▶│ │             │              │             │◀─────────────│ 返回令牌与用户 │             │              │◀────────────│              │ │             │              │ 写入会话并持久化             │ │             │◀─────────────│             │              │ │ 跳转工作台或来源页           │             │              │ │◀────────────│              │             │              │

关键约定：登录成功后若存在来源路径则回跳来源，否则进入工作台，均以 replace 方式跳转，避免用户点返回键又回到登录页；登录失败时不清理已填账号，只提示错误原因；演示环境下表单下方提供六个演示账号按钮，点击即填入账号与演示密码。

## 7.3 菜单导航与页签联动

从点击菜单到页面渲染共六步：点击叶子节点触发路由跳转；登录守卫与权限守卫依次通过；主框架在路由变化时按路径反查导航节点，生成页签标题与业务域并开页签；菜单选中态与展开态同步为当前页面；面包屑按链路重算；路由出口渲染目标页面，页面自身在其 Suspense 边界内完成分包加载。

反向联动同样六步：点击页签触发导航到其路径；守卫校验；主框架发现页签已存在只更新标题与业务域、不重复追加；菜单选中态与面包屑同步；页面渲染。关闭页签时按「右侧相邻、左侧相邻、工作台」顺序确定回退目标，若关闭的是非激活页签则只移除条目、当前位置不变。

## 7.4 越权访问处理

越权场景分三类，处理方式各不相同，三层防护协同。

菜单旁路：用户权限不足时，对应叶子节点在菜单过滤阶段即被移除，分组与业务域在子节点全空时不显示，用户从导航上无法到达。若通过顶栏业务域切换尝试进入，因域入口下拉同样取自过滤后的树，仍无法进入。

直连旁路：手工输入地址、使用书签或外部链接时，登录守卫通过后由页面级权限守卫拦截，在路由出口内渲染 403 结果页，页面展示所需权限码并保留主框架，用户可一键返回。

接口旁路：前端判定被绕过时，后端对接口二次校验并返回 403，前端请求层抛出「无权限访问该资源」，页面以错误提示承接，不渲染任何数据。

## 7.5 退出登录与会话失效

主动退出：点击用户菜单中的退出登录，调用退出接口（无论成功与否都继续），清理会话上下文与本地存储，跳转登录页。

被动失效：任一接口返回 401 时，请求层派发全局未授权事件并抛出「登录状态已失效，请重新登录」；会话上下文监听该事件，清理令牌、会话用户与相关本地存储，并把当前地址作为来源记录后跳转登录页。事件机制保证多个并发请求同时返回 401 时只执行一次会话清理与一次跳转。

## 7.6 演示登录回退

在开发环境且演示开关开启（环境变量 VITE_ENABLE_DEMO_LOGIN 取值为 true）时，登录请求失败且失败原因属于网络异常、超时或服务未启动时，前端回退到本地演示角色与账号完成登录，用于后端尚未就绪阶段推进前端验证。

回退的边界：当后端明确返回鉴权失败或返回体结构不符合预期时，不回退，直接提示真实错误，避免掩盖问题；当演示账号对应的角色配置缺失时，提示角色未配置。演示令牌形如 demo-token.账号.时间戳，仅用于满足登录态判定，不具备任何后端访问能力。生产构建中演示开关关闭，回退逻辑不生效，因此使用生产预览方式验证登录必然失败，功能验证须使用开发模式启动。

# 八、状态与存储设计

## 8.1 状态容器

前端只用两个 React 上下文承载全局状态，不引入独立状态库。

| 容器 | 状态 | 方法 | 职责 |
| --- | --- | --- | --- |
| 会话上下文 | 令牌、会话用户、登录态 | 登录、退出、取当前用户、判定是否已登录 | 会话建立与失效、权限集合提供 |
| 多页签上下文 | 页签集合、激活路径 | 开页签、关页签、关闭其他、关闭全部、刷新当前 | 页签生命周期与回退策略 |

选择 React 内置上下文而非状态库的理由：全局状态仅两处、更新频率低、无复杂异步派生需求，上下文足以覆盖且不增加依赖与包体；权限判定是纯函数，不需要放在状态层。

## 8.2 本地存储键设计

| 键 | 内容 | 写入时机 | 读取时机 |
| --- | --- | --- | --- |
| psnmgr.auth.token | 访问令牌 | 登录成功 | 应用启动、请求拦截器 |
| psnmgr.auth.user | 会话用户序列化结果 | 登录成功 | 应用启动恢复会话 |
| psnmgr.layout.collapsed | 侧边栏折叠状态 | 用户切换折叠 | 布局初始化 |
| psnmgr.layout.theme | 主题偏好 | 用户切换主题 | 主题初始化 |
| psnmgr.login.userName | 记住的登录账号 | 登录成功且勾选记住账号 | 登录页初始化 |

约定：统一使用 psnmgr 前缀，读写封装在 utils/storage.ts，含异常兜底（存储不可用或数据解析失败时返回空值，不抛出）；不存储密码、支付密钥或任何凭据；页签集合不做持久化，刷新后仅保留工作台页签并补开当前页，以避免跨版本页面路径变更导致的失效页签。

## 8.3 请求层设计

请求层为单一 axios 实例，集中处理地址、超时、鉴权头与错误归一化。

| 项 | 取值 | 说明 |
| --- | --- | --- |
| 基础地址 | 环境变量 VITE_API_BASE_URL，未设置时回退为 /api | 开发环境由 Vite 代理转发到后端 |
| 超时 | 20000 毫秒 | 超时归入网络异常 |
| 鉴权头 | Authorization: Bearer 加令牌 | 令牌取自会话上下文 |
| 成功码集合 | 0、200、SUCCESS、OK | 兼容后端不同风格的成功码 |
| 401 处理 | 派发未授权事件并抛出登录失效文案 | 由会话上下文统一清理 |
| 403 处理 | 抛出无权限文案 | 由页面展示 |
| 响应归一化 | 统一解包为数据部分，异常时抛出结构化错误 | 页面只需处理数据与错误 |

统一返回体为 code、message、data 三字段：code 为业务状态码，message 为面向用户的提示，data 为业务数据。前端只依 code 判定成功与否，data 为空时按接口约定返回空数组或空对象，避免页面出现未定义判断散落各处。

# 九、接口与数据约定

## 9.1 前端已约定接口清单

| 接口 | 方法 | 用途 | 请求 | 响应数据 |
| --- | --- | --- | --- | --- |
| /auth/login | POST | 登录并取回令牌与用户 | userName、password | token、user |
| /auth/profile | POST | 取当前用户档案与权限集合 | 无（凭令牌） | user |
| /auth/logout | POST | 退出登录 | 无 | 无 |
| /模块/资源/query | GET 或 POST | 业务列表查询与分页 | 查询条件、分页参数 | 列表、总数 |
| /模块/资源/save | POST | 新增或修改 | 业务对象 | 保存结果 |
| /模块/资源/remove | POST | 删除 | 主键集合 | 执行结果 |
| /模块/资源/export | POST | 报表导出 | 查询条件 | 文件流或导出任务号 |

命名约定：接口路径与权限码资源段保持同构，权限码 card:person:view 对应接口 /card/person/query，便于以自动化方式对照权限与接口，避免出现「有权限但无接口」或「有接口但无权限码」的缺口。

## 9.2 与 CS 数据库及权限表的映射

前端不直接访问数据库，所有数据经后端接口取得，但页面口径必须与 CS 保持一致。关键映射关系如下。

| 前端功能 | CS 侧数据来源 | 前端落点 |
| --- | --- | --- |
| 操作员与角色权限 | ST_UserInfo、ST_RoleInfo、ST_RoleRight、ST_RightInfo、ST_MenuInfo | 会话权限集合，对应系统管理的组织与权限分组 |
| 部门数据权限 | ST_DeptRight | 数据范围过滤，由后端按部门执行 |
| 机台权限 | ST_MOCRight | 消费与订餐机台范围，由后端执行 |
| 人员与卡 | ST_Person、ST_Card | 人员档案、账户与卡业务页面 |
| 人脸照片 | ST_PersonPhoto | 人脸照片库页面 |
| 充值资金 | ST_SupplyFund、ST_Card.Card_Balance | 充值存款与支付订单页面 |
| 消费明细 | XF_Consume | 消费流水与消费报表页面 |
| 订餐订单 | DC_OrderData、DC_OrderDataSub、SF_OrderData、SF_OrderDataSub | 订餐订单页面 |
| 订餐扣款模式 | ST_SysParam 的 DC.Solution | 订餐系统参数页面 |
| 考勤账套与每日考勤 | KQ_Account、KQ_Daily、KQ_DailyHistory | 账套管理、每日考勤与历史考勤页面 |
| 门禁通行记录 | MJ_NormalRecord、MJ_AbnormRecord、MJ_EventInfo | 门禁记录查询分组 |
| 访客预约单 | VisitorApply | 预约审核与预约记录页面 |
| 移动端身份 | ST_Person 的 OpenID 与 UnionID、ST_Card 的 Card_Password | 微信端与小程序端的会话与解绑逻辑 |

### 9.2.1 CS 权限表结构与权限码映射规则（V2 补充）

本节给出 CS 权限表到前端权限码集合的逐条映射规则，消除 10.3 节已知限制第 4 条"前端权限码与后端权限表映射尚未逐条对齐"的缺口。CS 权限相关表的字段级映射如下。

| **CS ****表** | **关键字段** | **映射到会话****/****权限的落点** |
| --- | --- | --- |
| **ST_UserInfo****（操作员）** | **User_No****、****User_Name****、****User_Pwd****、****Dept_ID** | **userId****、****userName****、****displayName****、****deptName****；登录校验源** |
| **ST_RoleInfo****（角色）** | **Role_No****、****Role_Name** | **roleNo****、****roleName****（顶栏角色标签）** |
| **ST_RoleRight****（角色权限）** | **Role_ID****、****Right_ID** | **角色→权限项的关联表，权限集合的取数入口** |
| **ST_RightInfo****（权限项）** | **Right_ID****、****Right_Code****、****Right_Name****、（****URL/****模块标记）** | **权限项字典；经权限码字典映射为三段式权限码** |
| **ST_MenuInfo****（菜单权限）** | **菜单**** ID****、父级、名称、****URL** | **CS ****侧菜单树，****BS ****导航映射依据（见需求文档**** ****附录**** B****）** |
| **ST_SubSysRight / ST_SubSystem****（子系统权限）** | **子系统**** ID****、角色**** ID** | **子系统级可见性，映射为业务域级授权语义** |
| **ST_DeptRight****（部门数据权限）** | **角色****/****用户、部门**** ID** | **数据范围（本人****/****本部门****/****本部门及下级****/****全部），不进入权限码集合** |
| **ST_MOCRight****（机台权限）** | **角色****/****用户、****MOC_No** | **消费****/****订餐****/****考勤机台范围，由后端执行数据裁剪** |

映射算法（后端职责）：

1. 登录时按操作员（ST_UserInfo）取出角色集合（经 ST_RoleInfo / ST_RoleRight），收集全部 Right_ID；

2. 查 ST_RightInfo 得到权限项明细，经「权限码字典」映射为三段式权限码。权限码字典建议以新增表 BS_RightCodeMap 承载（字段：Right_ID、Permission_Code、备注；按需求文档 5.1 以 BS_ 前缀新增，且登记入 ST_Dict_Table/ST_Dict_Field，见需求文档 5.5）；

3. 无法映射的 Right_ID 登记到待对照清单，禁止默认放行；上线前与本文附录 A 的 187 个页面级权限码做一次性全量对照，形成"权限码 ↔ Right_ID ↔ 接口"三向核对表；

4. 权限码集合（含前缀通配，见 6.2）下发到前端会话 user.permissions；ST_DeptRight、ST_MOCRight 转换为数据范围参数随会话下发或在接口侧直接执行，前端不做数据裁剪（见 6.10）。

接口侧鉴权：后端每个业务接口以「接口路径 ↔ 权限码」同构关系（见 9.1）校验调用者权限码集合，越权返回 403；不得依赖前端声明的角色编号。

## 9.3 页面口径中必须保持的硬规则

以下规则来自需求文档与既有实现约定，在页面接入真实接口时必须逐条落地，不得在前端自行调整口径。

数据库结构只增不删：BS 可新增表与字段，不得删除或改写 CS 既有结构与字段含义。

充值必须真实入账：充值写资金流水表并同步卡余额，且每笔充值留存日志。

人员主键贯通：所有涉及人员的业务表必须包含 Person_ID，作为跨子系统关联依据。

考勤取数规则：账套仅取当前账套（Account_Flag 为 0）；考勤日期晚于账套起始日期时取每日考勤表，否则取历史考勤表；无记录时先触发每日考勤计算。

门禁记录规则：正常通行取正常通行表，异常通行取异常通行表，通行方式与异常原因取事件信息表维护的名称。

订餐扣款规则：扣款模式由系统参数决定，订餐扣款模式下写订餐主子表并同步写消费明细，订 n 个菜品产生 n 条消费记录；消费扣款模式下只写消费侧主子表；主子表以订单号关联。

请假规则：请假记录必须带起止时间段。

移动端身份规则：微信端使用 OpenID、小程序使用 UnionID 写入人员表，且必须支持解绑；移动端会话令牌使用人员编号加卡密码，与操作员账号体系相互独立。

付款码与通行码由后端生成下发，前端不本地生成。

# 十、设计决策与权衡

## 10.1 关键技术决策

| 决策项 | 采用方案 | 放弃的备选 | 理由 |
| --- | --- | --- | --- |
| 路由来源 | 由导航树派生 | 手写路由清单 | 菜单与路由两处维护极易走样，派生可保证 187 个页面与菜单严格一一对应 |
| 全局状态 | React 上下文 | Redux 或轻量状态库 | 全局状态仅会话与页签两处，引入状态库增加依赖与包体却没有收益 |
| 路由模式 | 浏览器历史模式 | 哈希模式 | 需要干净的地址用于分享与后端联调；部署时需配置单页应用回退 |
| 权限策略 | 菜单前置过滤 | 先展示后拦截 | 无权限功能不出现，避免用户反复触发 403，同时减少菜单噪声 |
| 懒加载边界 | 每条路由独立边界 | 全局单一边界 | 单页加载失败不会连带卸载主框架，避免整屏白屏 |
| 顶栏结构 | 外壳与内容行两层 | 单层容器 | 单层容器在父级 flex 布局下会按内容收缩，导致右侧动作区不贴右边界 |
| 页签持久化 | 不持久化 | 持久化到本地存储 | 路径随版本演进易失效，刷新后重置为当前页更可控 |
| 权限码粒度 | 三段式到页面 | 两段式到功能 | 报表类页面需要区分到具体报表口径，三段式可精确授权 |

## 10.2 顶栏右对齐缺陷的定位与修复

问题现象：主框架顶栏的搜索框与右侧动作区未贴住内容区右边界，视觉上出现右侧留白，且左侧出现双重内边距、分隔线画出两道。

根因定位：主框架的顶栏组件与顶栏内容组件复用了同一个样式类名，而该类名承载了横向排布（display 为 flex）的职责；顶栏本体因此成为外层 flex 容器的子项，按内容宽度收缩而非撑满，右侧因此留出空白；同时内外两层都设置了左右内边距，叠加形成左侧双内边距与两道分隔线。实测在 1264 像素视口下，顶栏本体宽度 841、可用宽度 988、右侧空出约 147 像素，弹性占位元素宽度为 0，即占位元素未起到作用。

修复方案：把顶栏样式降级为纯外壳，只保留高度、底色与底部分隔线，不再设置横向排布与内边距；新增顶栏内容行样式承载 flex 排布、垂直居中、间距与左右内边距，并把内容组件根节点改用新类名。由于内容行是块级元素，会自动撑满外壳宽度，右侧动作区随之贴住内容区右边界。

修复后实测四个视口宽度下的几何结果如下。

| 视口宽度 | 内容行宽度 | 弹性占位宽度 | 最后一个元素右边缘距容器右沿 | 首个元素左边缘 |
| --- | --- | --- | --- | --- |
| 1440 | 1376 | 535 | 16 | 76 |
| 1100 | 1036 | 235 | 16 | 76 |
| 900 | 836 | 35 | 16 | 76 |
| 700 | 636 | 0 | 16 | 76 |

结论：四个宽度下内容行宽度均等于外壳宽度，右侧动作区右边缘距容器右沿恒为 16 像素，与内容区面包屑的右侧内边距一致；首个元素左边缘恒为 76 像素；横向无溢出，顶栏内容宽度等于可见宽度；搜索框在空间不足时按规则收缩至 258 与 184 像素。该修复已通过类型检查与生产构建验证，验证结论记入后文附录的文件清单。

设计约束：后续修改顶栏时，顶栏外壳与顶栏内容行不得复用同一类名，且弹性占位元素必须保留，否则右对齐能力会再次失效。遗留项有两个：顶栏左内边距当前为 12 像素，与内容区的 16 像素存在 4 像素差异，需与内容区统一；顶栏内存在一个空的占位节点，因组件库在无子节点时不渲染任何结构，该节点无效，应删除。

## 10.3 已知限制与演进方向

| 序号 | 限制 | 影响 | 演进方向 |
| --- | --- | --- | --- |
| 1 | 187 个业务路由均指向同一个占位页模板 | 页面暂无真实业务能力 | 按需求文档逐页替换为真实业务页面，框架与权限逻辑不变 |
| 2 | 每日考勤计算的存储过程名称待核实 | 考勤每日数据可能无法生成 | 在目标库核实实际名称与签名，缺失时在 BS 侧按同名过程补充 |
| 3 | 通知角标为静态数字 | 待办数量不实时 | 接入真实待办与通知接口，按角色轮询或订阅 |
| 4 | 前端权限码与后端权限表映射尚未逐条对齐 | 可能出现权限码与接口不对应 | 由后端从权限表生成权限码字典，与前端清单做一次性全量对照 |
| 5 | 菜单搜索为包含匹配，无拼音与首字母支持 | 中文输入效率受限 | 建立拼音与首字母索引，作为搜索索引的补充字段 |
| 6 | 界面仅简体中文 | 无法支持多语言 | 抽取界面文案资源，接入多语言框架 |
| 7 | 页签不持久化 | 刷新后需重新打开页面 | 若确有需要，改为按版本化的路径白名单持久化 |

# 附录 A 导航—路由—权限码全量对照表

本附录按业务域给出全部 187 个可路由页面的对照关系，四个字段依次为所属子功能分组、页面名称、路由路径、页面级权限码。工作台单独列出。表格同时作为权限码字面量的权威清单。

## A.1 工作台

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 首页 | 工作台 | /dashboard | dashboard:view |

## A.2 卡务中心（5 个分组、29 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 人员与组织 | 人员档案 | /card/person | card:person:view |
| 人员与组织 | 部门档案 | /card/dept | card:dept:view |
| 人员与组织 | 编码管理 | /card/code | card:code:view |
| 人员与组织 | 人脸照片库 | /card/face | card:face:view |
| 人员与组织 | 人员导入导出 | /card/import | card:import:view |
| 账户与卡 | 账户信息设置 | /card/account | card:account:view |
| 账户与卡 | 账户类别设置 | /card/account-type | card:accountType:view |
| 账户与卡 | 开户与销户 | /card/account-open | card:accountOpen:view |
| 账户与卡 | 账户冻结与解冻 | /card/freeze | card:freeze:view |
| 账户与卡 | 换卡与补卡 | /card/card-change | card:cardChange:view |
| 账户与卡 | 卡挂失与解挂 | /card/card-loss | card:cardLoss:view |
| 账户与卡 | 导入授权 ID 卡 | /card/card-import | card:cardImport:view |
| 账户与卡 | 个人账户 | /card/personal | card:personal:view |
| 资金业务 | 充值存款 | /card/recharge | card:recharge:view |
| 资金业务 | 用户取款 | /card/withdraw | card:withdraw:view |
| 资金业务 | 小金额转账 | /card/transfer | card:transfer:view |
| 资金业务 | 补贴发放 | /card/subsidy | card:subsidy:view |
| 资金业务 | 出纳授权 | /card/cashier-auth | card:cashierAuth:view |
| 资金业务 | 支付订单与日志 | /card/pay-order | card:payOrder:view |
| 结算与报表 | 会计出纳报表 | /card/report/cashier | card:report:cashier |
| 结算与报表 | 账户余额表 | /card/report/balance | card:report:balance |
| 结算与报表 | 卡状态统计表 | /card/report/card-state | card:report:cardState |
| 结算与报表 | 资金明细报表 | /card/report/fund-detail | card:report:fundDetail |
| 结算与报表 | 人员花名册 | /card/report/roster | card:report:roster |
| 日志与维护 | 系统日志管理 | /card/log | card:log:view |
| 日志与维护 | 数据备份 | /card/backup | card:backup:view |
| 日志与维护 | 数据清理 | /card/clean | card:clean:view |
| 日志与维护 | 黑名单管理 | /card/blacklist | card:blacklist:view |
| 日志与维护 | 财务结算 | /card/settlement | card:settlement:view |

## A.3 消费管理（4 个分组、26 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 基础资料 | 区域/食堂设置 | /consume/area | consume:area:view |
| 基础资料 | 餐别设置 | /consume/repast | consume:repast:view |
| 基础资料 | 菜谱设置 | /consume/menu | consume:menu:view |
| 基础资料 | 每日菜品设置 | /consume/daily-dish | consume:dailyDish:view |
| 基础资料 | 菜品与商品档案 | /consume/ware | consume:ware:view |
| 基础资料 | 打折类型设置 | /consume/discount | consume:discount:view |
| 基础资料 | 餐别消费模式设置 | /consume/mode | consume:mode:view |
| 基础资料 | 终端机设置 | /consume/terminal | consume:terminal:view |
| 基础资料 | 键值设置 | /consume/keyvalue | consume:keyvalue:view |
| 基础资料 | 生物识别消费机管理 | /consume/biometric | consume:biometric:view |
| 业务处理 | 消费流水 | /consume/records | consume:record:view |
| 业务处理 | 消费纠错 | /consume/correction | consume:correction:view |
| 业务处理 | 手工补消费 | /consume/manual | consume:manual:view |
| 业务处理 | U 盘导入消费 | /consume/import | consume:import:view |
| 业务处理 | 异常与冲正 | /consume/reversal | consume:reversal:view |
| 明细报表 | 正常消费明细表 | /consume/report/normal | consume:report:normal |
| 明细报表 | 纠错与补消费明细表 | /consume/report/correction | consume:report:correction |
| 明细报表 | 异常消费记录明细表 | /consume/report/abnormal | consume:report:abnormal |
| 明细报表 | 时长消费明细表 | /consume/report/time | consume:report:time |
| 明细报表 | 二维码支付日志 | /consume/report/qrcode-log | consume:report:qrcodeLog |
| 汇总报表 | 部门餐别汇总表 | /consume/summary/dept | consume:summary:dept |
| 汇总报表 | 人员餐别汇总表 | /consume/summary/person | consume:summary:person |
| 汇总报表 | 餐别日报表 | /consume/summary/repast | consume:summary:repast |
| 汇总报表 | 机台餐别汇总表 | /consume/summary/moc | consume:summary:moc |
| 汇总报表 | 品种消费汇总表 | /consume/summary/ware | consume:summary:ware |
| 汇总报表 | 二维码消费汇总 | /consume/summary/qrcode | consume:summary:qrcode |

## A.4 考勤管理（5 个分组、26 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 基础设置 | 账套管理 | /attendance/account | attendance:account:view |
| 基础设置 | 考勤规则 | /attendance/rule | attendance:rule:view |
| 基础设置 | 假种定义 | /attendance/leave-type | attendance:leaveType:view |
| 基础设置 | 法定假定义 | /attendance/holiday | attendance:holiday:view |
| 基础设置 | 考勤机设置 | /attendance/terminal | attendance:terminal:view |
| 基础设置 | 人员考勤信息 | /attendance/person | attendance:person:view |
| 基础设置 | 班次设置 | /attendance/shift | attendance:shift:view |
| 基础设置 | 安排班次 | /attendance/schedule | attendance:schedule:view |
| 考勤数据 | 考勤数据下载 | /attendance/download | attendance:download:view |
| 考勤数据 | 原始刷卡数据 | /attendance/raw | attendance:raw:view |
| 考勤数据 | 外进外出数据 | /attendance/out | attendance:out:view |
| 考勤数据 | 每日考勤 | /attendance/daily | attendance:daily:view |
| 考勤数据 | 历史考勤 | /attendance/history | attendance:history:view |
| 考勤数据 | 生物识别考勤机管理 | /attendance/biometric | attendance:biometric:view |
| 异常处理 | 请假登记 | /attendance/leave | attendance:leave:view |
| 异常处理 | 班次调整 | /attendance/adjust | attendance:adjust:view |
| 异常处理 | 调休补班 | /attendance/makeup | attendance:makeup:view |
| 异常处理 | 加班登记 | /attendance/overtime | attendance:overtime:view |
| 异常处理 | 增补刷卡 | /attendance/makeup-card | attendance:makeupCard:view |
| 异常处理 | 补出勤补加班 | /attendance/supplement | attendance:supplement:view |
| 拍照考勤机 | 照片对比 | /attendance/photo-compare | attendance:photo:compare |
| 拍照考勤机 | 实时显示 | /attendance/photo-realtime | attendance:photo:realtime |
| 拍照考勤机 | 配置参数 | /attendance/photo-config | attendance:photo:config |
| 统计报表 | 考勤日报表 | /attendance/report/daily | attendance:report:daily |
| 统计报表 | 考勤月报表 | /attendance/report/month | attendance:report:month |
| 统计报表 | 考勤年报表 | /attendance/report/year | attendance:report:year |

## A.5 门禁管理（7 个分组、37 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 设备与时段 | 控制器设置 | /access/controller | access:controller:view |
| 设备与时段 | 门属性设置 | /access/door | access:door:view |
| 设备与时段 | 门开关时段设置 | /access/door-time | access:doorTime:view |
| 设备与时段 | 门特殊时段设置 | /access/door-special | access:doorSpecial:view |
| 设备与时段 | 人进出时段设置 | /access/psn-time | access:psnTime:view |
| 设备与时段 | 人特殊时段设置 | /access/psn-special | access:psnSpecial:view |
| 设备与时段 | 进出权限方案管理 | /access/scheme | access:scheme:view |
| 设备与时段 | 扩展点设置 | /access/extension-point | access:extensionPoint:view |
| 授权与下发 | 人员设置 | /access/person | access:person:view |
| 授权与下发 | 门权限设置 | /access/permission | access:permission:view |
| 授权与下发 | 超级卡或密码 | /access/super-card | access:superCard:view |
| 授权与下发 | 刷卡添加用户 | /access/card-add | access:cardAdd:view |
| 授权与下发 | 管理卡设置 | /access/manage-card | access:manageCard:view |
| 联动与控制 | 控制器联动设置 | /access/linkage | access:linkage:view |
| 联动与控制 | 报警输出设置 | /access/alarm-out | access:alarmOut:view |
| 联动与控制 | 多门互锁设置 | /access/interlock | access:interlock:view |
| 联动与控制 | 紧急群组设置 | /access/emergency | access:emergency:view |
| 联动与控制 | 首卡开门设置 | /access/first-card | access:firstCard:view |
| 联动与控制 | 多卡开门设置 | /access/multi-card | access:multiCard:view |
| 联动与控制 | 会议管理 | /access/meeting | access:meeting:view |
| 联动与控制 | DVS 联动 | /access/dvs | access:dvs:view |
| 远程监控 | 门禁控制台 | /access/console | access:console:view |
| 远程监控 | 电子地图设计 | /access/map-design | access:map:design |
| 远程监控 | 地图实时监控 | /access/map-monitor | access:map:monitor |
| 远程监控 | 人脸识别终端 | /access/face-terminal | access:faceTerminal:view |
| 记录查询 | 正常通行记录 | /access/record/normal | access:record:normal |
| 记录查询 | 异常通行记录 | /access/record/abnormal | access:record:abnormal |
| 记录查询 | 报警事件记录 | /access/record/alarm | access:record:alarm |
| 记录查询 | 实时监控记录 | /access/record/realtime | access:record:realtime |
| 指纹门禁 | 时段设置 | /access/finger/time | access:finger:time |
| 指纹门禁 | 时段组别设置 | /access/finger/group | access:finger:group |
| 指纹门禁 | 开锁组合设置 | /access/finger/combo | access:finger:combo |
| 指纹门禁 | 人员时段设置 | /access/finger/person | access:finger:person |
| 指纹门禁 | 生物识别门禁机管理 | /access/finger/terminal | access:finger:terminal |
| 系统维护 | 门禁系统参数 | /access/param | access:param:view |
| 系统维护 | 扩展功能设置 | /access/extension | access:extension:view |
| 系统维护 | 清理过期数据 | /access/clean | access:clean:view |

## A.6 订餐管理（4 个分组、19 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 基础设置 | 系统参数设置 | /meal/param | meal:param:view |
| 基础设置 | 订餐机设置 | /meal/terminal | meal:terminal:view |
| 基础设置 | 订餐规则设置 | /meal/rule | meal:rule:view |
| 基础设置 | 订餐时间设置 | /meal/time | meal:time:view |
| 基础设置 | 食堂与区域 | /meal/area | meal:area:view |
| 基础设置 | 菜品与类别 | /meal/ware | meal:ware:view |
| 基础设置 | 每日菜品 | /meal/daily-dish | meal:dailyDish:view |
| 基础设置 | 餐别设置 | /meal/repast | meal:repast:view |
| 订餐业务 | 订餐数据下载 | /meal/download | meal:download:view |
| 订餐业务 | 订餐机控制台 | /meal/console | meal:console:view |
| 订餐业务 | 手工订餐 | /meal/manual | meal:manual:view |
| 订餐业务 | 撤销订餐 | /meal/cancel | meal:cancel:view |
| 订餐业务 | 订餐订单 | /meal/order | meal:order:view |
| 订餐业务 | 取餐核销 | /meal/verify | meal:verify:view |
| 订餐报表 | 订餐数据明细 | /meal/report/detail | meal:report:detail |
| 订餐报表 | 订餐数据汇总 | /meal/report/summary | meal:report:summary |
| 订餐报表 | 未用餐明细 | /meal/report/unused | meal:report:unused |
| 订餐报表 | 未用餐汇总 | /meal/report/unused-summary | meal:report:unusedSummary |
| 系统维护 | 过期数据清理 | /meal/clean | meal:clean:view |

## A.7 访客管理（4 个分组、10 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 预约与审批 | 访客预约登记 | /visitor/apply | visitor:apply:view |
| 预约与审批 | 预约审核 | /visitor/approve | visitor:approve:view |
| 预约与审批 | 访客预约记录 | /visitor/apply-record | visitor:applyRecord:view |
| 访客业务 | 访客卡登记 | /visitor/card | visitor:card:view |
| 访客业务 | 访客签到签离 | /visitor/checkin | visitor:checkin:view |
| 访客业务 | 访客通行登记 | /visitor/access | visitor:access:view |
| 记录与报表 | 访客签到记录 | /visitor/checkin-record | visitor:record:checkin |
| 记录与报表 | 访客进出记录 | /visitor/access-record | visitor:record:access |
| 记录与报表 | 访客报表 | /visitor/report | visitor:record:report |
| 参数设置 | 访客参数设置 | /visitor/param | visitor:param:view |

## A.8 水控/巡更（2 个分组、15 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 水控管理 | 卡类设置 | /utility/water/card-type | utility:water:cardType |
| 水控管理 | 终端机设置 | /utility/water/terminal | utility:water:terminal |
| 水控管理 | 消费场合设置 | /utility/water/area | utility:water:area |
| 水控管理 | 水控补贴机 | /utility/water/subsidy | utility:water:subsidy |
| 水控管理 | 特殊卡管理 | /utility/water/special-card | utility:water:specialCard |
| 水控管理 | 打折时段设置 | /utility/water/discount | utility:water:discount |
| 水控管理 | 区域/场所设置 | /utility/water/site | utility:water:site |
| 水控管理 | 采集记录 | /utility/water/record | utility:water:record |
| 水控管理 | 采集数据汇总表 | /utility/water/report | utility:water:report |
| 巡更管理 | 巡更点设置 | /utility/patrol/site | utility:patrol:site |
| 巡更管理 | 巡更线路设置 | /utility/patrol/route | utility:patrol:route |
| 巡更管理 | 巡更人员与计划 | /utility/patrol/plan | utility:patrol:plan |
| 巡更管理 | 巡更记录 | /utility/patrol/record | utility:patrol:record |
| 巡更管理 | 巡更日报 | /utility/patrol/daily | utility:patrol:daily |
| 巡更管理 | 巡更异常事件 | /utility/patrol/event | utility:patrol:event |

## A.9 报表中心（2 个分组、9 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 综合运营 | 运营总览 | /report/overview | report:overview |
| 综合运营 | 财务综合报表 | /report/finance | report:finance |
| 综合运营 | 消费综合报表 | /report/consume | report:consume |
| 综合运营 | 考勤综合报表 | /report/attendance | report:attendance |
| 综合运营 | 门禁综合报表 | /report/access | report:access |
| 综合运营 | 订餐综合报表 | /report/meal | report:meal |
| 报表工具 | 报表模板 | /report/template | report:template |
| 报表工具 | 常用报表 | /report/favorite | report:favorite |
| 报表工具 | 导出任务 | /report/export-task | report:exportTask |

## A.10 系统管理（3 个分组、16 个页面）

| 分组 | 页面名称 | 路径 | 权限码 |
| --- | --- | --- | --- |
| 组织与权限 | 操作员管理 | /system/operator | system:operator:view |
| 组织与权限 | 角色管理 | /system/role | system:role:view |
| 组织与权限 | 菜单与操作权限 | /system/permission | system:permission:view |
| 组织与权限 | 部门数据权限 | /system/dept-right | system:deptRight:view |
| 组织与权限 | 设备权限 | /system/device-right | system:deviceRight:view |
| 组织与权限 | 子系统权限 | /system/subsystem-right | system:subsystemRight:view |
| 组织与权限 | 出纳授权管理 | /system/cashier-auth | system:cashierAuth:view |
| 系统配置 | 系统参数 | /system/param | system:param:view |
| 系统配置 | 数据字典 | /system/dict | system:dict:view |
| 系统配置 | 接口与集成 | /system/integration | system:integration:view |
| 系统配置 | 数据维护 | /system/maintain | system:maintain:view |
| 系统配置 | 黑名单管理 | /system/blacklist | system:blacklist:view |
| 安全审计 | 系统日志 | /system/log/system | system:log:system |
| 安全审计 | 登录日志 | /system/log/login | system:log:login |
| 安全审计 | 操作审计 | /system/log/oper | system:log:oper |
| 安全审计 | 同步日志 | /system/log/sync | system:log:sync |

# 附录 B 角色权限矩阵

下表为开发环境内置的六个演示角色及其权限码集合。正式环境由后端按 CS 权限表下发，角色名称与部门仅作展示。

| 角色 | 部门 | 权限码集合 | 实际可见范围 |
| --- | --- | --- | --- |
| R_ADMIN 系统管理员 | 信息中心 | 全局通配 | 全部九个业务域与工作台，全部操作 |
| R_CASHIER 卡务出纳 | 财务处 | dashboard:view、card 全域、consume:record 全域、consume:report 全域、consume:summary 全域、report 全域、system:log 全域 | 工作台、卡务中心、消费管理的流水与明细汇总报表、报表中心、系统管理的四类日志 |
| R_HR 人事考勤 | 人力资源部 | dashboard:view、attendance 全域、card:person:view、card:dept:view、card:face:view、card:report:roster、visitor 全域、report:overview、report:attendance | 工作台、考勤管理、卡务中心的人员档案与部门档案、人脸照片库与人员花名册、访客管理、报表中心的运营总览与考勤综合报表 |
| R_SECURITY 门禁安保 | 保卫处 | dashboard:view、access 全域、visitor 全域、card:person:view、card:face:view、report:overview、report:access | 工作台、门禁管理、访客管理、卡务中心的人员档案与人脸照片库、报表中心的运营总览与门禁综合报表 |
| R_CANTEEN 食堂消费 | 后勤服务集团 | dashboard:view、consume 全域、meal 全域、card:person:view、report:overview、report:consume、report:meal | 工作台、消费管理、订餐管理、卡务中心的人员档案、报表中心的运营总览与消费、订餐综合报表 |
| R_VIEWER 运营查看 | 校务办公室 | dashboard:view、report 全域 | 工作台与报表中心全部页面，其余业务域不显示 |

矩阵使用说明有三条。

通配粒度：表中「全域」指使用前缀通配（域键加冒号加星号）授权，覆盖该域下全部资源与操作；单点授权使用完整三段码。前缀通配的匹配规则见 6.3 节，card 全域可覆盖 card:report:cashier 这类三段码，因此卡务出纳虽未单列报表权限，仍可见卡务中心的结算与报表分组。

域权限与菜单可见性：业务域节点自身声明的权限码（如 card:view）不参与菜单过滤判定，域与分组的可见性完全由子节点过滤结果决定，因此上表按「实际可见范围」列出的范围即为真实菜单表现。域权限码当前仅作为域级授权语义与顶栏业务域切换的兜底字段使用，后续若需要「整域授权但无任何子页权限」的语义，应由后端在下发时展开为具体权限码。

数据范围：本矩阵只描述功能权限，不描述数据范围（本人、本部门、本机台、全部）。数据范围权限由后端按 CS 的部门权限与机台权限表执行。

## B.1 需求角色与演示角色对照（V2 补充）

本表将《人脸通 BS 系统需求文档》3.2 节的业务角色与本附录演示角色对齐，正式环境角色名称与权限以 CS 的 ST_RoleInfo / ST_RoleRight 实际数据为准，演示角色仅用于开发环境。

| **需求文档业务角色** | **权限码域覆盖** | **对应演示角色** | **数据范围（****ST_DeptRight / ST_MOCRight****）** |
| --- | --- | --- | --- |
| **系统管理员** | *******（全局通配）** | **R_ADMIN** | **全部** |
| **卡务****/****出纳员** | **card:*****、****consume:record:*****、****consume:report:*****、****consume:summary:*****、****report:*****、****system:log:*** | **R_CASHIER** | **全部****/****本部门** |
| **消费管理员** | **consume:*****、****card:person:view** | **R_CANTEEN****（消费部分）** | **全部****/****本机台** |
| **考勤管理员** | **attendance:*****、****card:person:view****、****card:dept:view** | **R_HR** | **全部****/****本部门及下级** |
| **门禁管理员** | **access:*****、****card:person:view****、****card:face:view** | **R_SECURITY** | **全部****/****本部门** |
| **订餐管理员** | **meal:*****、****card:person:view** | **R_CANTEEN****（订餐部分）** | **全部****/****本机台** |
| **访客审批人** | **visitor:*** | **R_HR / R_SECURITY** | **本部门** |
| **部门主管** | **业务域只读（按需授予）** | **无独立演示角色** | **本部门及下级** |
| **个人用户** | **不适用（移动端身份来自**** ST_Person + ST_Card****，见**** 9.3 ****移动端身份规则）** | **不适用** | **仅本人** |

说明：R_CANTEEN 在演示态同时覆盖 consume 与 meal 两域，对应需求侧可拆分为消费管理员与订餐管理员两个角色；拆分与否由 CS 的 ST_RoleInfo 实际配置决定，权限码域的对应关系不变。个人用户不进入管理端权限体系统计口径（见 6.1、9.3）。

# 附录 C 演示账号

演示账号仅用于开发环境，密码统一为演示密码，生产构建的演示登录开关关闭后不可使用。

| 账号 | 显示姓名 | 角色编号 | 角色名称 | 部门 |
| --- | --- | --- | --- | --- |
| admin | 系统管理员 | R_ADMIN | 系统管理员 | 信息中心 |
| cashier | 出纳 - 张明 | R_CASHIER | 卡务出纳 | 财务处 |
| hr | 考勤 - 李慧 | R_HR | 人事考勤 | 人力资源部 |
| security | 安保 - 王强 | R_SECURITY | 门禁安保 | 保卫处 |
| canteen | 食堂 - 赵磊 | R_CANTEEN | 食堂消费 | 后勤服务集团 |
| viewer | 运营 - 陈婷 | R_VIEWER | 运营查看 | 校务办公室 |

演示账号的使用方式：开发环境登录页下方展示六个账号标签，点击即填入账号名与演示密码；登录成功后用户名显示为姓名，顶栏角色标签显示角色名称，菜单与业务域下拉按上表范围裁剪，可直接用于权限表现的验收。演示用户主键按「U 加账号大写」构造，与正式环境使用 CS 操作员编号保持一致的数据结构，切换正式环境不需要改动前端。

# 附录 D 文件清单与关键实现位置

下表给出本文档涉及的全部关键文件及其职责，便于开发与评审时逐项对照。

| 文件 | 职责 | 关键内容 |
| --- | --- | --- |
| src/main.tsx | 应用入口 | 挂载根组件、引入全局样式 |
| src/App.tsx | 根组件 | 主题与中文语言包注入、会话与页签上下文装配、路由挂载 |
| src/layouts/AdminLayout.tsx | 主框架 | 侧边栏、顶栏、多页签、内容区装配；折叠状态、菜单过滤、页签同步 |
| src/layouts/components/BrandLogo.tsx | 品牌标识 | 品牌渐变方块与折叠态切换 |
| src/layouts/components/SideMenu.tsx | 侧边栏菜单 | 多级渲染、选中与展开联动、关键词过滤 |
| src/layouts/components/HeaderBar.tsx | 顶栏内容行 | 折叠开关、业务域切换、搜索、刷新、全屏、通知、用户菜单 |
| src/layouts/components/GlobalSearch.tsx | 全局搜索 | 菜单索引匹配与层级链路候选 |
| src/layouts/components/UserMenu.tsx | 用户菜单 | 头像、姓名、角色标签与下拉动作 |
| src/layouts/components/AppBreadcrumb.tsx | 面包屑 | 路径链路渲染与首页回跳 |
| src/layouts/components/TabsBar.tsx | 多页签 | 页签渲染、关闭策略、页签操作下拉 |
| src/router/index.tsx | 路由总装 | 登录路由、鉴权、域重定向、187 条叶子路由、403 与 404 |
| src/router/RequireAuth.tsx | 登录守卫 | 未登录跳转并记录来源路径 |
| src/router/PermissionGate.tsx | 权限守卫 | 页面级权限判定与内嵌 403 |
| src/config/menu.tsx | 导航总装 | 工作台与九域装配、11 个派生工具函数 |
| src/config/menu/card.tsx | 卡务中心导航 | 5 个分组、29 个页面 |
| src/config/menu/consume.tsx | 消费管理导航 | 4 个分组、26 个页面 |
| src/config/menu/attendance-access.tsx | 考勤与门禁导航 | 考勤 5 分组 26 页、门禁 7 分组 37 页 |
| src/config/menu/meal-visitor-utility.tsx | 订餐、访客与水控巡更导航 | 订餐 19 页、访客 10 页、水控巡更 15 页 |
| src/config/menu/report-system.tsx | 报表中心与系统管理导航 | 报表 9 页、系统 16 页 |
| src/config/roles.ts | 角色与账号 | 六个演示角色、六个演示账号、会话用户构造 |
| src/store/auth.tsx | 会话上下文 | 登录态、会话用户、权限集合、未授权事件监听 |
| src/store/tabs.tsx | 页签上下文 | 页签集合、开闭策略、回退目标解析 |
| src/hooks/usePermission.ts | 权限钩子 | 权限集合与判定函数的页面级封装 |
| src/utils/permission.ts | 权限匹配 | 精确、全局通配与前缀通配判定，可读文案转换 |
| src/utils/storage.ts | 本地存储 | 键名常量、安全读写与异常兜底 |
| src/services/http.ts | 请求层 | axios 实例、鉴权头、超时、统一返回体与错误归一化 |
| src/services/auth.ts | 鉴权请求 | 登录、档案、退出登录与演示登录回退 |
| src/pages/LoginPage.tsx | 登录页 | 左右分栏布局、表单与演示账号 |
| src/pages/DashboardPage.tsx | 工作台 | 概览卡片与权限化快捷入口 |
| src/pages/ModulePage.tsx | 业务占位页 | 头部、查询区、表格与操作权限派生 |
| src/pages/ForbiddenPage.tsx | 403 结果页 | 所需权限展示与返回入口 |
| src/pages/NotFoundPage.tsx | 404 结果页 | 兜底提示与返回工作台 |
| src/types/navigation.ts | 类型定义 | 导航、权限、页签、会话与派生结构类型 |
| src/styles/global.css | 全局样式 | 顶栏与侧边栏等布局类、CSS 变量 |
| src/styles/theme.ts | 主题配置 | 品牌色常量与 Ant Design 主题令牌 |
| src/vite.config.ts | 构建配置 | 路径别名、开发端口、接口代理、产物分块 |

已完成的验证结论（供交付评审参考）：类型检查与生产构建均通过，首次构建产出 3128 个模块、耗时约 19.5 秒，主要分块体积见 5.3 节；顶栏右对齐修复在 1440、1100、900、700 四个视口宽度下的几何测量结果见 10.2 节，均无横向溢出；权限表现经双角色（系统管理员与运营查看）实测，未登录跳转、越权拦截、菜单裁剪、页签与面包屑联动的行为与本文档描述一致；工程打包产物为单压缩包，含 48 个条目、体积 80 380 字节，不含依赖目录与构建产物。
