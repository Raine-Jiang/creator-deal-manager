"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { SetupNotice } from "./SetupNotice";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    async function redirectIfSignedIn() {
      const { data } = await supabase!.auth.getSession();
      if (data.session) router.replace("/");
    }
    redirectIfSignedIn();
  }, [router]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    if (!supabase) {
      setMessage("当前是演示模式。配置 Supabase 后即可登录。");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setIsError(true);
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        setMessage("邮箱或密码不正确。如果这是第一次使用，请先点击下方“创建账号”。");
      } else {
        setMessage(error.message);
      }
    } else {
      router.replace("/");
    }
  }

  async function createAccount() {
    setMessage("");
    setIsError(false);
    if (!supabase) {
      setMessage("当前是演示模式。配置 Supabase 后即可登录。");
      return;
    }
    if (!email.trim() || password.length < 6) {
      setIsError(true);
      setMessage("请输入邮箱，并设置至少 6 位密码。");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setIsError(true);
      if (error.message.toLowerCase().includes("already registered")) {
        setMessage("这个邮箱已经创建过账号，请直接登录。");
      } else {
        setMessage(error.message);
      }
    } else if (data.session) {
      router.replace("/");
    } else {
      setMessage("账号已创建。如果 Supabase 仍开启邮箱确认，请先按邮件完成确认；建议关闭邮箱确认以避免邮件限流。");
    }
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

        <form onSubmit={submitAuth} className="card mt-5 space-y-4 p-5">
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

          <label className="login-field">
            <Lock className="h-5 w-5 text-muted" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入密码"
              className="min-w-0 flex-1 bg-transparent font-bold outline-none placeholder:text-muted"
              minLength={6}
              required
            />
          </label>

          {message ? (
            <p className={`rounded-2xl p-3 text-sm font-semibold ${isError ? "bg-red-50 text-red-500" : "bg-violet-50 text-violet-600"}`}>
              {message}
            </p>
          ) : null}

          <button className="primary-button w-full justify-center py-4 text-lg" disabled={loading}>
            {loading ? "处理中..." : "登录"}
          </button>
          <button
            type="button"
            onClick={createAccount}
            disabled={loading}
            className="w-full rounded-[18px] bg-warm py-3.5 text-base font-black text-ink disabled:opacity-50"
          >
            创建账号
          </button>
          <p className="text-center text-xs font-semibold leading-5 text-muted">
            不需要短信验证码，也不需要每次收邮件。登录成功后会自动保持会话。
          </p>
        </form>
      </div>
    </AppShell>
  );
}
