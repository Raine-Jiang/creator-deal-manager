# Creator Deal Manager

Creator Deal Manager 是一个手机优先的创作者商单管理 Web App / PWA，用来记录舞蹈博主的广告合作、发布日期、佣金、本金、状态和备注。当前版本以个人使用为主，支持云端持久化、登录保护、图片上传、日历、财务统计、每日创作者收益、垃圾桶和数据导入导出。

## 先决条件

- 后续任何 AI 或开发者接手时，必须先阅读 `docs/PROJECT_CONTEXT.md`，优先使用这份短上下文，而不是回溯完整聊天历史。
- 后续小 bug 修复只读取相关文件，避免无意义地消耗大量 token。
- 新版本开发前后都要同步更新 `docs/PROJECT_CONTEXT.md`，让项目上下文保持可复用。
- 未经明确要求，不自动推送 GitHub，也不自动部署正式环境。

## 当前功能

- 邮箱密码登录，登录成功后自动保持会话
- 首页工作台：需要关注、财务提醒、合作统计、最近合作
- 合作列表：搜索、状态筛选、发布日期筛选、发布日期排序、批量移入垃圾桶
- 新建 / 编辑合作：品牌、产品、产品图、品类、接单日期、最晚发布、合作形式、是否垫付、本金、佣金、状态、备注
- 合作详情：查看已填写字段，支持快捷标记已发布、合作费已收、本金已返、完成合作
- 日历：按最晚发布日期展示合作，待发布 / 已发布 / 已完成用不同颜色区分
- 财务：支持本月、上月、近三个月、近一年、累计和自定义日期范围
- 每日收益：在财务页按天记录抖音等平台创作者收益，支持左右切换日期、点选日期和直接修改当天记录，并按同一时间范围汇总
- 品类分析：按上衣、裤子、套装、裙子、鞋子、配饰、其他、未分类统计金额和合作数
- 我的：修改密码、已完成合作、垃圾桶、按日期字段和时间范围导出 Excel 可打开的表格
- 导入 Excel：从旧 `.xlsx` 表格自动识别品牌、产品、品类、发布日期、金额、状态、备注和嵌入产品图，预览确认后批量写入
- 垃圾桶：删除后保留 30 天，支持恢复和永久删除
- 产品图上传前在浏览器压缩为 WebP，降低 Supabase Storage 占用

## 数据逻辑

- 真实数据保存在 Supabase PostgreSQL，不依赖浏览器本地缓存。
- `user_id` 用于隔离用户数据，RLS 保证用户只能读写自己的合作。
- 合作默认按 `created_at` 倒序展示。
- `completed = true` 或存在 `archived_at` 时，合作视为已完成。
- `deleted_at` 有值时，合作进入垃圾桶；普通列表、首页、日历、财务默认不统计垃圾桶数据。
- 日历只使用 `publish_deadline` 作为主日期。
- 财务周期统计只使用 `publish_deadline` 归属月份或日期范围。
- 每日创作者收益保存在独立的 `daily_earnings` 表，不和商单佣金混算；同一天重复填写会更新当天记录，财务页不会展示冗长流水列表。
- 品类统计来自 `product_category`；旧数据未补品类时会进入“未分类”。
- Excel 导入会按表头自动匹配字段；无法识别的日期、品类或金额会在预览中提示。
- Excel 导入未匹配但有内容的列会按 `表头：内容` 追加到备注。
- Excel 内嵌图片会尽力按所在行识别，并压缩为 WebP 后上传；不能解析图片时仍会导入文字数据。
- Excel 导出可选择日期依据和时间范围，包括本月、上月、近三个月、近一年、累计和自定义日期。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth Email + Password
- Supabase PostgreSQL
- Supabase Storage
- Vercel

## 本地运行

```bash
npm install
npm run dev
```

常用开发地址：

```text
http://localhost:3000
```

如果端口被占用，Next.js 会自动切换到其他端口。

## 环境变量

复制 `.env.example` 为 `.env.local`，填入真实值：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET=deal-product-images
```

不要提交 `.env.local`。

## Supabase 后端

数据库、RLS 和 Storage 配置在 `supabase.sql` 中。

首次配置或字段更新时：

1. 打开 Supabase 项目。
2. 进入 SQL Editor。
3. 运行 `supabase.sql`。
4. 在 Authentication 中开启 Email provider。
5. 建议关闭 Confirm email，让个人工具注册后可直接登录。
6. 如果使用密码重置邮件，在 Auth URL Configuration 中添加线上域名。

## 部署

海外访问推荐部署到 Vercel 免费额度：

1. 将项目推送到 GitHub。
2. 在 Vercel 导入 GitHub 仓库。
3. 在 Vercel Project Settings 配置环境变量。
4. 使用免费的 `*.vercel.app` 域名上线。
5. 回到 Supabase Auth URL Configuration 添加线上域名。

项目根目录也保留了 `edgeone.json`，后续可以用于尝试 EdgeOne Pages 国内访问版本。
