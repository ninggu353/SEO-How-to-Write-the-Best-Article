# AI Collaboration Workflow

本文件是给所有参与本仓库维护的 AI agent 读取的协作规则。开始任何任务前，先读 `README.md` 和本文件。

## Project Boundary

本仓库是 SEO 文章写作工作台的独立 Storybook 前端原型，只允许提交：

- Storybook UI 代码
- React 组件和样式
- 脱敏 mock 数据
- 启动和构建配置
- 项目协作文档

禁止提交：

- API Key、OAuth client secret、refresh token、access token
- 真实客户 Word、Excel、CSV、GSC 导出
- 真实文章草稿、终稿、客户素材
- 本地数据库、缓存、日志、运行时输出
- `node_modules`、`dist`、`storybook-static`

如果不确定某个文件是否可提交，默认不要提交，并在回复中说明风险。

## Required Start Routine

每次开工前执行并阅读结果：

```bash
git status --short
git branch --show-current
git remote -v
git config user.name
git config user.email
```

如果 `git config user.name` 或 `git config user.email` 没有输出，先停止提交，并让人类配置本仓库提交身份。不要猜测人类的真实邮箱。

推荐配置为仓库级别，而不是全局配置：

```bash
git config user.name "<Your Name or AI Bot Name>"
git config user.email "<GitHub verified email or bot email>"
```

如果当前分支是 `main`，不要直接修改后推送到 `main`。先同步并创建任务分支：

```bash
git checkout main
git pull --ff-only origin main
git checkout -b ai/<owner>/<task-slug>
```

分支命名示例：

- `ai/ops/update-score-copy`
- `ai/dev/fix-step-editor-state`
- `ai/docs/add-pr-workflow`
- `ai/ui/refine-workspace-layout`

## Ownership and Scope

每个任务只改和目标直接相关的文件。不要顺手重构无关代码。

运营内容类任务优先修改：

- `src/seo-workspace/sampleWorkspaceData.js`
- `src/seo-workspace/SeoArticleWorkspace.stories.js`
- 文案、标签、mock 状态和演示数据

产品 UI 或交互类任务可以修改：

- `src/seo-workspace/SeoArticleWorkspace.jsx`
- `src/seo-workspace/components/*.jsx`
- `src/seo-workspace/seo-workspace.css`
- `src/App.jsx`
- `src/App.css`

配置类任务可以修改：

- `package.json`
- `vite.config.js`
- Storybook 相关配置

涉及真实客户资料、生产 API、鉴权、数据库或后端接口时，先停止并向人类确认。

## Local Change Routine

修改前先确认工作区是否已有他人或用户改动：

```bash
git status --short
```

如果发现已有未提交改动：

- 不要回滚。
- 不要覆盖。
- 只在必要文件上做最小修改。
- 提交前用 `git diff` 确认本次提交只包含本任务改动。

推荐小步提交。一次提交只表达一个清晰意图。

提交信息格式：

```text
<type>: <short English summary>
```

常用 `type`：

- `content`：运营文案或 mock 内容
- `ui`：布局、样式、视觉调整
- `feat`：新增功能或交互
- `fix`：修复 bug
- `docs`：文档
- `chore`：配置、依赖、清理

示例：

```bash
git commit -m "content: update article scoring examples"
git commit -m "ui: refine revision panel layout"
git commit -m "docs: add ai collaboration workflow"
```

## Verification Before Push

推送前至少执行：

```bash
npm run lint
npm run build
```

如果改了 Storybook stories、组件展示或视觉状态，也执行：

```bash
npm run build-storybook
```

如果命令失败：

- 优先修复本任务引入的问题。
- 如果失败来自既有问题，在回复和 PR 描述中明确说明。
- 不要在验证失败且未说明原因的情况下推送。

## Push and Pull Request Routine

确认当前不在 `main`：

```bash
git branch --show-current
```

首次推送前确认本机已有 GitHub 凭据。Windows 通常使用 Git Credential Manager。如果 `git push` 提示没有凭据，先让人类完成 GitHub 登录或 token 配置。

推送任务分支：

```bash
git push -u origin <branch-name>
```

开 PR 时描述必须包含：

- 本次改了什么
- 为什么改
- 影响范围
- 验证命令及结果
- 是否包含敏感数据：否

PR 合并前至少需要 1 人 review。运营内容类 PR 由运营侧确认内容，技术或项目负责人确认代码和仓库边界。

## Conflict Handling

如果 push 被拒绝，通常说明远端已有新提交。不要强推，先同步：

```bash
git fetch origin
git pull --rebase origin <current-branch>
```

如果 PR 与 `main` 冲突，在任务分支上处理：

```bash
git fetch origin
git rebase origin/main
```

解决冲突时：

- 人工阅读冲突两侧内容。
- 保留双方真正需要的改动。
- 不要简单选择全部 ours 或 theirs，除非人类明确要求。
- 解决后重新运行验证命令。

继续 rebase：

```bash
git add <resolved-files>
git rebase --continue
```

完成后推送：

```bash
git push
```

如果 rebase 后必须更新远端分支历史，只能在自己的任务分支使用：

```bash
git push --force-with-lease
```

使用 `--force-with-lease` 前必须确认：

- 当前分支不是 `main`
- 当前分支只归本任务使用
- 没有覆盖其他人的工作

禁止对 `main` 使用 force push。

## Main Branch Rules

`main` 是稳定分支。

AI agent 不允许：

- 直接向 `main` push
- 在 `main` 上提交任务代码
- 删除远端分支，除非人类明确要求
- 修改历史、reset、rebase `main`
- 回滚他人改动，除非人类明确要求

允许：

- 从 `main` 创建任务分支
- 将 `main` 的最新提交 rebase/merge 到任务分支
- 通过 PR 合并到 `main`

## AI-to-AI Coordination

当两边都由 AI 开发时，默认按 Issue 或任务说明分工。

每个 AI 在回复中应明确：

- 当前分支
- 修改了哪些文件
- 验证结果
- 是否有未解决冲突或风险
- 是否已经 push

如果发现另一个 AI 正在改同一文件或同一功能区域：

- 停止扩大修改范围。
- 先同步 `origin/main`。
- 在回复中说明可能冲突的文件。
- 必要时让人类决定谁先合并。

推荐合并顺序：

1. 小范围文档或内容 PR 先合并。
2. 结构性代码 PR 后合并。
3. 后合并者负责同步最新 `main` 并解决冲突。

## Final Response Format for AI

任务完成后，用简短中文回复：

```text
已完成：<一句话说明>

修改文件：
- <file>

验证：
- npm run lint：通过/失败，原因
- npm run build：通过/失败，原因

Git：
- branch: <branch>
- commit: <hash 或未提交>
- push: 已推送/未推送

风险或待确认：
- 无 / <具体事项>
```
