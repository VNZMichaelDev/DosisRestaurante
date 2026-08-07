"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cedula, setCedula] = useState("");
  const [locLat, setLocLat] = useState<number | null>(null);
  const [locLng, setLocLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  // Intercambia el código de verificación de correo que llega por URL
  // (ej: /auth?code=...). Sin esto, el correo se confirma pero no se crea la sesión.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    let cancelled = false;

    (async () => {
      let supabase: ReturnType<typeof createClient> | null = null;
      try {
        supabase = createClient();
      } catch {
        // Sin variables de entorno
      }
      if (!supabase) {
        setTimeout(() => setError("Falta configurar Supabase."), 0);
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (exchangeError) {
        setError(`No se pudo confirmar tu correo: ${exchangeError.message}`);
        return;
      }

      setInfo("Correo verificado. ¡Sesión iniciada!");
      const next = params.get("next") || "/";
      setTimeout(() => {
        window.location.href = next;
      }, 800);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Detecta la sesión actual: si ya iniciaste sesión, mostramos tu perfil
  // en lugar del formulario de login.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(async () => {
      let supabase: ReturnType<typeof createClient> | null = null;
      try {
        supabase = createClient();
      } catch {
        // Sin variables de entorno
      }
      if (!supabase) {
        setChecking(false);
        return;
      }
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      setUser(current);
      setChecking(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Consulta si el usuario es administrador para mostrar el enlace al panel.
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!user) {
        setAdmin(false);
        return;
      }

      let supabase: ReturnType<typeof createClient> | null = null;
      try {
        supabase = createClient();
      } catch {
        // Sin variables de entorno
      }
      if (!supabase) {
        setAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      setAdmin(data?.is_admin ?? false);
    }, 0);

    return () => clearTimeout(timer);
  }, [user]);

  const getNext = (): string => {
    if (typeof window === "undefined") return "/";
    return new URLSearchParams(window.location.search).get("next") || "/";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setUnconfirmedEmail(null);
    setLoading(true);

    const next = getNext();

    try {
      const supabase = createClient();

      if (mode === "signup") {
        if (locLat == null || locLng == null) {
          setError(
            "Debes compartir tu ubicación para poder crear la cuenta."
          );
          setLoading(false);
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              cedula: cedula.trim(),
              lat: locLat ?? "",
              lng: locLng ?? "",
            },
            emailRedirectTo: `${window.location.origin}/auth${
              next === "/" ? "" : `?next=${encodeURIComponent(next)}`
            }`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          if (/already registered/i.test(signUpError.message)) {
            setMode("login");
          }
        } else if (data.session) {
          window.location.href = next;
        } else {
          setInfo(
            "Revisa tu correo y haz clic en el enlace de confirmación. Luego podrás iniciar sesión."
          );
          setMode("login");
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) {
          const msg = loginError.message;
          if (/not confirmed/i.test(msg) && /email/i.test(msg)) {
            setUnconfirmedEmail(email);
            setError(
              "Tu correo aún no está confirmado. Abre el enlace que te enviamos por email para activar tu cuenta, o pídenos reenviarlo."
            );
          } else {
            setError(msg);
          }
        } else {
          window.location.href = next;
        }
      }
    } catch (err) {
      setError(
        "No se pudo conectar con el servidor. Verifica tus variables de entorno de Supabase."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLocError("Tu navegador no soporta compartir ubicación.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocLat(pos.coords.latitude);
        setLocLng(pos.coords.longitude);
        setLocating(false);
        setLocError(null);
      },
      () => {
        setLocating(false);
        setLocError(
          "No pudimos obtener tu ubicación. Permite el acceso al GPS e intenta de nuevo."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const resendEmail = async () => {
    if (!unconfirmedEmail) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: unconfirmedEmail,
      });
      if (resendError) {
        setError(resendError.message);
      } else {
        setInfo(
          "Reenviamos el enlace de confirmación. Revisa tu correo (y la carpeta de spam)."
        );
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignorar
    }
    setUser(null);
    router.push("/");
    router.refresh();
  };

  if (checking) {
    return (
      <AppShell>
        <div className="loading-screen">
          <div className="spinner" /> Cargando…
        </div>
      </AppShell>
    );
  }

  if (user) {
    const fullName =
      (user.user_metadata?.full_name as string) || user.email || "";
    const initial = (fullName.trim()[0] || "?").toUpperCase();

    return (
      <AppShell>
        <div className="auth-wrap">
          <h1 className="page-title">Tu perfil</h1>
          <p className="page-sub">Sesión iniciada correctamente.</p>

          <div className="auth-card">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--green)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 16, display: "block" }}>
                  {fullName || "Cliente"}
                </b>
                <span style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
                  {user.email}
                </span>
              </div>
            </div>

            <div style={{ height: 18 }} />

            <Link href="/pedidos" className="btn btn-ghost btn-block">
              📦 Mis pedidos
            </Link>
            <div style={{ height: 8 }} />

            {admin && (
              <>
                <Link href="/admin" className="btn btn-primary btn-block">
                  🛠️ Panel de administración
                </Link>
                <div style={{ height: 8 }} />
              </>
            )}

            <Link href="/" className="btn btn-ghost btn-block">
              Ir al menú
            </Link>
            <div style={{ height: 8 }} />
            <button
              className="btn btn-ghost btn-block"
              onClick={logout}
              disabled={loading}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="auth-wrap">
        <h1 className="page-title">Tu perfil</h1>
        <p className="page-sub">Inicia sesión para hacer tus pedidos.</p>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
                setUnconfirmedEmail(null);
              }}
            >
              Iniciar sesión
            </button>
            <button
              className={`auth-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
                setUnconfirmedEmail(null);
              }}
            >
              Crear cuenta
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
          {unconfirmedEmail && (
            <button
              className="btn btn-ghost btn-block btn-sm"
              style={{ marginTop: 10 }}
              onClick={resendEmail}
              disabled={loading}
            >
              Reenviar enlace de confirmación
            </button>
          )}

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <div className="field">
                  <label htmlFor="name">Nombre completo</label>
                  <input
                    id="name"
                    className="input"
                    type="text"
                    placeholder="Ej: María Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cedula">Cédula</label>
                  <input
                    id="cedula"
                    className="input"
                    type="text"
                    placeholder="Ej: V-12345678"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <button
                    type="button"
                    className={`loc-btn ${locLat != null ? "done" : ""}`}
                    onClick={locate}
                    disabled={locating}
                  >
                    {locating
                      ? "⏳ Obteniendo ubicación…"
                      : locLat != null
                        ? "✓ Ubicación compartida"
                        : "📍 Compartir tu ubicación (obligatorio)"}
                  </button>
                  {locLat != null && (
                    <div className="loc-ok">
                      ✅ Ubicación capturada
                      <a
                        href={`https://www.google.com/maps?q=${locLat},${locLng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver en mapa
                      </a>
                    </div>
                  )}
                  {locError && <div className="loc-err">{locError}</div>}
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading
                ? "Procesando…"
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>
          </form>

          <div className="auth-foot">
            {mode === "login" ? (
              <span>
                ¿No tienes cuenta?{" "}
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--green)",
                    fontWeight: 800,
                    padding: 0,
                  }}
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                    setUnconfirmedEmail(null);
                  }}
                >
                  Regístrate
                </button>
              </span>
            ) : (
              <span>
                ¿Ya tienes cuenta?{" "}
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--green)",
                    fontWeight: 800,
                    padding: 0,
                  }}
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setInfo(null);
                    setUnconfirmedEmail(null);
                  }}
                >
                  Inicia sesión
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
