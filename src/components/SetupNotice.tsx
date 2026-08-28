import { Database, ShieldCheck } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="rounded-[24px] border border-violet-100 bg-white/78 p-4 shadow-soft backdrop-blur">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-ink">当前是演示模式</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            填写 Supabase 环境变量后会启用登录、数据库保存和产品图上传。SQL
            建表脚本已经放在项目里。
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-violet-600">
            <ShieldCheck className="h-4 w-4" />
            <span>真实数据会按登录用户隔离</span>
          </div>
        </div>
      </div>
    </div>
  );
}

