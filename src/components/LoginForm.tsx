"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, Mail, Sparkles } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { SetupNotice } from "./SetupNotice";

const productionOrigin = "https://creator-deal-manager.vercel.app";

function getPasswordResetRedirectUrl() {
  if (typeof window === "undefined") return `${productionOrigin}/login?mode=recovery`;
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const origin = isLocalhost ? window.location.origin : productionOrigin;
  return `${origin}/login?mode=recovery`;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const isRecoveryLink = window.location.search.includes("mode=recovery");
    if (isRecoveryLink) {
      queueMicrotask(() => {
        setRecoveryMode(true);
        setMessage("请输入新密码，保存后会自动进入首页。");
        setIsError(false);
      });
    }

    async function redirectIfSignedIn() {
      const { data } = await supabase!.auth.getSession();
      if (data.session && !isRecoveryLink) router.replace("/");
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setForgotMode(false);
        setMessage("请输入新密码，保存后会自动进入首页。");
        setIsError(false);
      }
    });

    redirectIfSignedIn();

    return () => listener.subscription.unsubscribe();
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setIsError(true);
        setMessage("账号已创建，但暂时不能自动登录。请刷新页面后用同一邮箱和密码登录。");
      } else {
        router.replace("/");
      }
    }
  }

  async function sendResetEmail() {
    setMessage("");
    setIsError(false);
    if (!supabase) {
      setMessage("当前是演示模式。配置 Supabase 后即可发送重置邮件。");
      return;
    }
    if (!email.trim()) {
      setIsError(true);
      setMessage("请先输入需要重置密码的邮箱。");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    setMessage("重置密码邮件已发送。请打开邮件里的链接，然后在这里设置新密码。");
  }

  async function updateRecoveredPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!supabase) {
      setIsError(true);
      setMessage("当前是演示模式，配置 Supabase 后才能重置密码。");
      return;
    }

    if (resetPassword.length < 6) {
      setIsError(true);
      setMessage("新密码至少需要 6 位。");
      return;
    }

    if (resetPassword !== confirmResetPassword) {
      setIsError(true);
      setMessage("两次输入的新密码不一致。");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: resetPassword });
    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage("重置链接可能已失效，请重新发送一次密码重置邮件。");
      return;
    }

    router.replace("/");
  }

  return (
    <AppShell showNav={false}>
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="mb-8">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#8b5cf6,#ff6b9e)] text-white shadow-lift">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="text-sm font-bold text-violet-500">Creator Deal Manager</p>
          <h1 className="mt-2 text-[42px] font-black leading-none">{recoveryMode ? "设置新密码" : forgotMode ? "找回密码" : "登录"}</h1>
          <p className="mt-3 text-base font-semibold text-muted">
            {recoveryMode ? "给账号换一个新的安全密码。" : forgotMode ? "输入邮箱，我们会发送一封重置邮件。" : "把每一条合作稳稳记住。"}
          </p>
        </div>

        {!isSupabaseConfigured ? <SetupNotice /> : null}

        {recoveryMode ? (
          <form onSubmit={updateRecoveredPassword} className="card mt-5 space-y-4 p-5">
            <label className="login-field">
              <KeyRound className="h-5 w-5 text-muted" />
              <input
                type="password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                placeholder="输入新密码"
                className="min-w-0 flex-1 bg-transparent font-bold outline-none placeholder:text-muted"
                minLength={6}
                required
              />
            </label>

            <label className="login-field">
              <Lock className="h-5 w-5 text-muted" />
              <input
                type="password"
                value={confirmResetPassword}
                onChange={(event) => setConfirmResetPassword(event.target.value)}
                placeholder="再次输入新密码"
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
              {loading ? "保存中..." : "更新密码"}
            </button>
          </form>
        ) : (
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

            {!forgotMode ? (
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
            ) : null}

            {message ? (
              <p className={`rounded-2xl p-3 text-sm font-semibold ${isError ? "bg-red-50 text-red-500" : "bg-violet-50 text-violet-600"}`}>
                {message}
              </p>
            ) : null}

            {forgotMode ? (
              <>
                <button type="button" onClick={sendResetEmail} className="primary-button w-full justify-center py-4 text-lg" disabled={loading}>
                  {loading ? "发送中..." : "发送重置邮件"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setMessage("");
                    setIsError(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-warm py-3.5 text-base font-black text-ink disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回登录
                </button>
              </>
            ) : (
              <>
                <button className="primary-button w-full justify-center py-4 text-lg" disabled={loading}>
                  {loading ? "处理中..." : "登录"}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={createAccount}
                    disabled={loading}
                    className="rounded-[18px] bg-warm py-3.5 text-base font-black text-ink disabled:opacity-50"
                  >
                    创建账号
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setMessage("");
                      setIsError(false);
                    }}
                    className="rounded-[18px] bg-warm/70 py-3.5 text-base font-black text-ink disabled:opacity-50"
                  >
                    忘记密码
                  </button>
                </div>
                <p className="text-center text-xs font-semibold leading-5 text-muted">
                  登录成功后会自动保持会话；忘记密码时可通过邮箱重新设置。
                </p>
              </>
            )}
          </form>
        )}
      </div>
    </AppShell>
  );
}
