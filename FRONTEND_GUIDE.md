# CFBlog 前台开发指南

## 项目结构

```
src/frontend/
├── components/          # 模块化组件
│   ├── layout.js      # 布局组件
│   ├── post-card.js   # 文章卡片组件
│   └── pagination.js  # 分页组件
├── themes/             # 主题系统
│   ├── default/       # 默认主题
│   │   ├── home.html     # 首页模板
│   │   └── style.css    # 样式文件
│   └── dark/         # 深色主题
├── i18n/               # 国际化
│   ├── zh-cn.js      # 简体中文
│   └── en-us.js      # 英文
├── utils/              # 工具函数
│   ├── i18n.js        # i18n 工具
│   └── theme.js       # 主题管理工具
└── template-engine.js  # 模板引擎
```

## 核心功能

### 1. 语义化 HTML

使用 HTML5 语义化标签：
- `<header role="banner">` - 页眉/导航
- `<main role="main">` - 主要内容区
- `<article>` - 文章内容
- `<section>` - 内容区块
- `<nav role="navigation">` - 导航菜单
- `<aside>` - 侧边栏
- `<footer role="contentinfo">` - 页脚
- `<time datetime="...">` - 日期时间
- ARIA 属性支持

### 2. 模块化组件

所有UI组件都是独立的模块，可复用：
- `Layout` - 页面布局框架
- `PostCard` - 文章卡片展示
- `Pagination` - 分页控件
- 可轻松添加新组件

### 3. 主题系统

#### 支持的主题
- `default` - 默认浅色主题
- `dark` - 深色主题

#### 主题切换
```javascript
// 使用工具函数
import { setUserTheme } from './frontend/utils/theme.js';

// 切换到深色主题
setUserTheme('dark');

// 切换到默认主题
setUserTheme('default');
```

#### 主题配置
主题定义在 `themes.js` 中，包含：
- CSS 变量（颜色、间距、字体等）
- 显示名称和描述

#### 后台主题设置
主题保存在数据库的 `settings` 表中：
```sql
UPDATE settings SET value = 'dark' WHERE key = 'theme';
```

### 4. 国际化 (i18n)

#### 支持的语言
- `zh-cn` - 简体中文（默认）
- `en-us` - 英文

#### 语言切换
```javascript
// 自动检测浏览器语言
import { getBrowserLanguage } from './frontend/utils/i18n.js';

// 获取当前语言
import { getCurrentLanguage } from './frontend/utils/i18n.js';

// 手动设置语言
import { setUserLanguage } from './frontend/utils/i18n.js';
setUserLanguage('en-us');
```

#### 翻译使用
```javascript
import { t } from './frontend/utils/i18n.js';

// 简单翻译
const text = t('nav.home'); // 首页

// 带参数翻译
const message = t('pagination.page', { page: 1 }); // 第 1 页
```

#### 语言优先级
1. 用户手动设置（localStorage）
2. 浏览器语言设置
3. 默认语言（zh-cn）

### 5. 响应式设计

默认主题包含完整的响应式设计：
- 移动端优先 (< 768px)
- 平板端 (768px - 1024px)
- 桌面端 (> 1024px)

## 使用方法

### 前端页面

所有页面路由：
- `/` - 首页
- `/post/:slug` - 文章详情
- `/category/:slug` - 分类页面
- `/tag/:slug` - 标签页面
- `/categories` - 全部分类
- `/tags` - 全部标签
- `/search?q=keyword` - 搜索
- `/feedback` - 留言板
- `/login` - 登录页面

### 静态资源

静态资源应该放在 `static/` 目录：
```
static/
├── css/
│   └── themes/
│       ├── default/
│       │   └── style.css
│       └── dark/
│           └── style.css
└── js/
    └── app.js  # 前端交互脚本
```

### 创建新主题

1. 在 `src/frontend/themes/` 创建新目录
2. 创建 `style.css` 定义主题变量
3. 创建 HTML 模板文件（如 `home.html`）
4. 在 `theme.js` 中注册新主题

### 添加新语言

1. 在 `src/frontend/i18n/` 创建新语言文件
2. 复制 `zh-cn.js` 的结构
3. 翻译所有文本键值
4. 在 `i18n.js` 中注册

## CSS 变量系统

### 颜色变量
```css
--color-primary: #2563eb;
--color-secondary: #64748b;
--color-background: #ffffff;
--color-text: #1f2937;
```

### 间距变量
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
```

### 主题切换
主题切换时，通过 JavaScript 修改 CSS 变量：
```javascript
document.documentElement.style.setProperty('--color-primary', newColor);
document.documentElement.style.setProperty('--color-background', newColor);
```

## API 集成

前台页面通过以下 API 获取数据：
- `GET /api/post/list` - 文章列表
- `GET /api/post/slug/:slug` - 文章详情
- `GET /api/category/list` - 分类列表
- `GET /api/tag/list` - 标签列表
- `GET /api/tag/popular` - 热门标签
- `GET /api/search?q=` - 搜索
- `GET /api/feedback/list` - 留言列表
- `POST /api/comment/create` - 创建评论
- `POST /api/feedback/create` - 创建留言

## 浏览器兼容性

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 现代移动浏览器

不支持 IE 浏览器。

## 性能优化

1. **CSS 变量** - 使用 CSS 变量便于主题切换
2. **代码分割** - 按需加载主题和语言文件
3. **缓存策略** - 静态资源使用浏览器缓存
4. **响应式图片** - 根据设备加载合适尺寸
5. **懒加载** - 图片和内容懒加载

## 可访问性 (Accessibility)

- 完整的 ARIA 标签
- 键盘导航支持
- 屏幕阅读器友好
- 足够的颜色对比度
- 适当的焦点指示器

## 开发建议

1. **组件化开发** - 每个功能拆分为独立组件
2. **语义化标签** - 始终使用正确的 HTML5 标签
3. **响应式优先** - 从小屏幕开始，逐步增强
4. **主题兼容** - 确保所有主题都能正常工作
5. **i18n 友好** - 避免硬编码文本
6. **性能意识** - 注意渲染性能和加载速度

## 后续开发建议

1. **更多主题** - 添加更多主题选项
2. **更多语言** - 支持更多语言
3. **搜索建议** - 添加搜索建议功能
4. **文章分享** - 集成社交媒体分享
5. **评论嵌套** - 实现评论回复功能
6. **相关文章** - 基于标签推荐相关文章
7. **PWA 支持** - 添加离线支持
8. **图片懒加载** - 优化图片加载性能
