# SEO 文章写作自我迭代工具

这是独立的 Vite + React 前端工作台项目，用于设计和验证 SEO 文章写作工作区 UI。

## 启动

```bash
cd D:\SEO\SEO-How-to-Write-the-Best-Article
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

打开：

```text
http://127.0.0.1:5173/
```

## 仓库边界

本仓库只保留：

- Vite 前端 UI 代码
- 组件样式
- 脱敏 mock 数据
- 启动配置

不要提交：

- API Key
- Google OAuth 文件
- refresh token / access token
- 真实客户 Word / Excel / GSC 导出
- 真实文章草稿 / 终稿
- 本地数据库
- `node_modules`、`dist`

## 接入后端

页面中的 API 配置由使用者本地填写；凭据应保存在本地或后端外部安全配置中，不写进代码仓库。
