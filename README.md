# Creator Deal Manager V1

Creator Deal Manager 是一个手机优先的创作者商单管理 Web App / PWA。V1 面向个人使用，帮助舞蹈博主记录每一条广告合作的品牌、产品、图片、金额、垫付、收货、拍摄、发布、回款和备注信息。

## V1 功能范围

- 邮箱密码登录，登录状态会自动保留
- 合作列表，默认按创建时间倒序
- 品牌 / 产品关键词搜索
- 新建合作
- 查看合作详情
- 编辑已创建合作，适合后续补充收货、拍摄、发布、回款等不确定时间
- 删除合作，并二次确认
- 每条合作支持 1 张产品主图
- PWA manifest，可添加到手机主屏幕
- Supabase Row Level Security，用户只能访问自己的合作数据

## V1 暂不包含

- 多人协作
- 品牌 CRM
- 财务统计页
- 日历页
- 推送提醒
- 自动状态流转
- 离线编辑

这些会留给后续版本迭代。

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

默认开发地址：

```text
http://localhost:3000
```

## 环境变量

复制 `.env.example` 为 `.env.local`，然后填入真实值：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET=deal-product-images
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL` 是 Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是 Supabase publishable / anon key
- `NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET` 是产品图 bucket 名称

不要提交 `.env.local`。

## Supabase 后端

数据库和 Storage 结构在 `supabase.sql` 中。

首次部署 Supabase 时：

1. 打开 Supabase 项目。
2. 进入 SQL Editor。
3. 运行 `supabase.sql`。
4. 在 Authentication 中开启 Email provider。
5. 建议关闭 Confirm email，让个人工具注册后可直接登录，避免邮件限流。
6. 如果仍使用邮件确认或魔法链接，在 Auth URL Configuration 中添加本地地址和线上地址。

当前后端设计：

- `deals` 表保存合作数据
- `user_id` 用于数据隔离
- RLS 已开启
- Storage bucket：`deal-product-images`
- 图片路径按用户隔离：`user_id/deal_id/product.ext`

## 数据安全与备份

V1 的真实数据保存在 Supabase PostgreSQL，不会因为浏览器刷新、换设备或本地项目丢失而消失。

建议上线后做两件事：

- 定期在 Supabase Dashboard 导出数据库备份
- 后续版本增加“导出 CSV / Excel”功能，方便自己留一份本地备份

## 部署

海外访问推荐部署到 Vercel 免费额度：

1. 将项目推送到 GitHub。
2. 在 Vercel 导入 GitHub 仓库。
3. 在 Vercel Project Settings 配置环境变量。
4. 使用 Vercel 免费的 `*.vercel.app` 域名先上线。
5. 回到 Supabase Auth URL Configuration 添加线上域名。

中国境内访问可以再部署一份 EdgeOne Pages 免费版本。项目根目录已包含 `edgeone.json`，用于告诉 EdgeOne：

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `.next`
- Node.js: `22.11.0`

更详细步骤见 `docs/DEPLOYMENT.md`。

## 后续迭代

建议见 `docs/ROADMAP.md`。
