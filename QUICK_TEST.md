# 快速测试指南

本文档提供快速测试项目的步骤。

## 前提条件

确保已完成以下步骤：

1. ✅ 安装依赖: `npm install`
2. ✅ 运行数据库迁移: `npm run db:local`
3. ✅ 创建管理员用户（已自动创建: admin / admin123）
4. ✅ 启动开发服务器: `npm run dev`

## 测试步骤

### 1. 测试前台页面

打开浏览器访问:

- **首页**: http://localhost:8787
  - [ ] 页面正常加载
  - [ ] 显示导航菜单
  - [ ] 显示文章列表区域

- **关于页面**: http://localhost:8787/about
  - [ ] 页面正常加载

- **联系页面**: http://localhost:8787/contact
  - [ ] 页面正常加载
  - [ ] 显示反馈表单

### 2. 测试后台登录

访问: http://localhost:8787/admin/login

- [ ] 显示登录表单
- [ ] 输入 `admin` / `admin123`
- [ ] 点击登录后跳转到管理后台

### 3. 测试分类管理

1. 点击"分类"菜单
2. 点击"新建分类"
3. 填写:
   - 名称: `测试分类`
   - Slug: `test-category`
   - 描述: `这是测试分类`
4. 点击保存

**验证:**
- [ ] 分类创建成功
- [ ] 出现在分类列表中

### 4. 测试标签管理

1. 点击"标签"菜单
2. 点击"新建标签"
3. 填写:
   - 名称: `测试标签`
   - Slug: `test-tag`
4. 点击保存

**验证:**
- [ ] 标签创建成功
- [ ] 出现在标签列表中

### 5. 测试文章创建

1. 点击"文章"菜单
2. 点击"新建文章"
3. 填写:
   - 标题: `测试文章`
   - Slug: `test-post`
   - 摘要: `这是文章摘要`
   - 内容: `# 测试文章\n\n这是文章正文。`
   - 分类: 选择刚创建的分类
   - 标签: 选择刚创建的标签
   - 状态: 发布
4. 点击保存

**验证:**
- [ ] 文章创建成功
- [ ] 出现在文章列表中

### 6. 测试前台显示

访问: http://localhost:8787

**验证:**
- [ ] 显示刚创建的文章
- [ ] 文章标题正确
- [ ] 文章摘要正确
- [ ] 点击文章可以查看详情

### 7. 测试评论功能

1. 点击文章进入详情页
2. 在评论区填写:
   - 姓名: `测试用户`
   - 邮箱: `test@example.com`
   - 内容: `这是一条测试评论`
3. 点击提交

**验证:**
- [ ] 评论提交成功
- [ ] 评论显示在文章下方

### 8. 测试评论管理

1. 访问后台: http://localhost:8787/admin
2. 点击"评论"菜单

**验证:**
- [ ] 显示刚提交的评论
- [ ] 可以批准评论
- [ ] 可以删除评论

### 9. 测试反馈功能

访问: http://localhost:8787/contact

填写:
- 姓名: `测试用户`
- 邮箱: `test@example.com`
- 主题: `测试反馈`
- 内容: `这是一条测试反馈`

点击提交

**验证:**
- [ ] 反馈提交成功
- [ ] 后台反馈列表中显示

### 10. 测试搜索功能

访问: http://localhost:8787/search?q=测试

**验证:**
- [ ] 显示搜索结果
- [ ] 显示测试文章
- [ ] 搜索空关键词不报错

## API 测试

### 使用测试脚本

```bash
# 运行所有测试
npm run test:all

# 只运行单元测试
npm run test:unit

# 只运行集成测试
npm run test:integration
```

### 手动 API 测试

#### 1. 登录 API

```bash
curl -X POST http://localhost:8787/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期响应:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

#### 2. 获取文章列表

```bash
curl http://localhost:8787/api/post/list
```

#### 3. 创建文章（需要令牌）

```bash
curl -X POST http://localhost:8787/api/post/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "API测试文章",
    "content": "这是通过API创建的文章"
  }'
```

## 常见问题

### 1. 登录失败

**问题**: 无法登录后台

**解决方案**:
- 确认用户名是 `admin`
- 确认密码是 `admin123`
- 检查数据库是否已迁移: `npm run db:local`

### 2. 文章不显示

**问题**: 创建的文章在前台不显示

**解决方案**:
- 确认文章状态是"发布"
- 刷新前台页面
- 检查浏览器控制台是否有错误

### 3. 测试失败

**问题**: API 测试失败

**解决方案**:
- 确认开发服务器正在运行: `npm run dev`
- 检查服务器地址是 `http://localhost:8787`
- 查看服务器日志是否有错误

## 测试检查清单

完成以下检查清单确认系统正常:

### 基本功能
- [ ] 前台页面正常显示
- [ ] 后台可以登录
- [ ] 可以创建分类
- [ ] 可以创建标签
- [ ] 可以创建文章
- [ ] 可以编辑文章
- [ ] 可以删除文章
- [ ] 文章在前台正确显示

### 交互功能
- [ ] 可以提交评论
- [ ] 可以提交反馈
- [ ] 可以搜索文章
- [ ] 可以按分类查看文章
- [ ] 可以按标签查看文章

### 管理功能
- [ ] 可以批准/拒绝评论
- [ ] 可以删除评论
- [ ] 可以管理用户
- [ ] 可以查看反馈

## 下一步

完成测试后，你可以:

1. 部署到 Cloudflare: 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
2. 查看完整文档: 查看 [README.md](./README.md)
3. 自定义主题: 修改 `src/routes/frontend.js` 中的 HTML
4. 添加新功能: 参考 `src/routes/` 中的示例代码

## 获取帮助

如果遇到问题:

1. 查看错误日志
2. 检查 [TEST_SUMMARY.md](./TEST_SUMMARY.md) 中的测试文档
3. 检查 [tests/README.md](./tests/README.md) 中的详细说明
4. 查看 GitHub Issues（如果是开源项目）

---

祝你测试愉快！ 🎉
