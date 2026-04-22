"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErr("Credenciales inválidas");
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mana-black via-mana-red-dark to-mana-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-7">
          <div className="flex flex-col items-center">
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-mana-black ring-2 ring-mana-yellow">
              <Image
                src="/logo.png"
                alt="Maná"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <h1 className="font-display font-black text-2xl text-mana-ink mt-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-mana-red" /> Panel Admin
            </h1>
            <p className="text-mana-muted text-sm mt-1">
              Ingresa con tu cuenta de encargado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-mana-ink">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-mana mt-1.5"
                placeholder="admin@manafood.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-mana-ink">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-mana mt-1.5"
                placeholder="••••••••"
              />
            </div>

            {err && (
              <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-2.5 text-sm text-red-700 text-center">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full btn-primary py-3"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="text-[11px] text-mana-muted text-center mt-4">
            Crea el usuario admin en Supabase → Auth → Users.
          </p>
        </div>
      </div>
    </main>
  );
}
