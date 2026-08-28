"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { SetupNotice } from "./SetupNotice";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    async function redirectIfSignedIn() {
      const { data } = await supabase!.auth.getSession();
      if (data.session) router.replace("/");
    }
    redirectIfSignedIn();
  }, [router]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("当前是演示模式。配置 Supabase 后即可登录。");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);

    if (error) setMessage(error.message);
    else setMessage("登录链接已发送，请打开邮箱点击链接进入系统。");
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="mb-8">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#8b5cf6,#ff6b9e)] text-white shadow-lift">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="text-sm font-bold text-violet-500">Creator Deal Manager</p>
          <h1 className="mt-2 text-[42px] font-black leading-none">登录</h1>
          <p className="mt-3 text-base font-semibold text-muted">
            把每一条合作稳稳记住。
          </p>
        </div>

        {!isSupabaseConfigured ? <SetupNotice /> : null}

        <form onSubmit={sendMagicLink} className="card mt-5 space-y-4 p-5">
          <label className="login-field">
            <Mail className="h-5 w-5 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="输入邮箱"
              className="min-w-0 flex-1 bg-transparent font-bold outline-none placeholder:text-muted"
              required
            />
          </label>

          {message ? (
            <p className="rounded-2xl bg-violet-50 p-3 text-sm font-semibold text-violet-600">
              {message}
            </p>
          ) : null}

          <button className="primary-button w-full justify-center py-4 text-lg" disabled={loading}>
            {loading ? "发送中..." : "发送登录链接"}
          </button>
          <p className="text-center text-xs font-semibold leading-5 text-muted">
            不需要短信服务，也不用记密码。登录成功后会自动保持会话。
          </p>
        </form>
      </div>
    </AppShell>
  );
}
