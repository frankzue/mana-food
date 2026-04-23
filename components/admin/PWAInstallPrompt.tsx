"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, Plus, X } from "lucide-react";

/**
 * Popup flotante para instalar el panel como PWA (Progressive Web App).
 *
 * Sólo se muestra dentro de /admin. Su objetivo es que el encargado/trabajador
 * agregue el panel al home screen del teléfono para abrirlo como si fuera una
 * app nativa (pantalla completa, icono con el logo, entra de una en vez de
 * tener que abrir el navegador y escribir la URL).
 *
 * Comportamiento:
 * - Chrome / Edge / Android: escucha `beforeinstallprompt` y al hacer click
 *   dispara el diálogo nativo de instalación.
 * - Safari / iOS: no soporta beforeinstallprompt → muestra instrucciones
 *   manuales (Compartir → Agregar a la pantalla de inicio).
 * - Si el usuario descarta el popup, se guarda la fecha y no reaparece en 7 días.
 * - Si ya está abierto como PWA (display-mode standalone), no se muestra.
 */

const DISMISS_KEY = "mana-pwa-dismiss";
const REAPPEAR_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ya está instalado: no molestar.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari expone `navigator.standalone`
      (navigator as any).standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Si fue descartado hace <7 días, no reaparecer.
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const diasDesde = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    if (dismissedAt && diasDesde < REAPPEAR_DAYS) return;

    // Detectar iOS Safari (no soporta beforeinstallprompt).
    const ua = window.navigator.userAgent;
    const iosDetectado = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    if (iosDetectado) {
      setIsIOS(true);
      // Tarda un poquito para no aparecer de golpe al entrar.
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }

    // Resto de navegadores: esperar el evento nativo.
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Si ya se instaló mientras la página está abierta, ocultamos.
    function onInstalled() {
      setInstalled(true);
      setVisible(false);
    }
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setVisible(false);
    setDeferred(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (installed || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar panel"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-sm z-[60] animate-slide-up"
    >
      <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        <div className="p-4 flex items-start gap-3">
          {/* Icono: fondo gris-negro moderno con un ligero gradiente y el
              logo en un tamaño algo menor (p-1.5) para que "respire" dentro
              del contenedor y no se vea apretado. */}
          <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 ring-1 ring-black/20 shadow-inner shrink-0 grid place-items-center">
            <div className="relative h-7 w-7">
              <Image
                src="/logo.png"
                alt="Maná"
                fill
                sizes="28px"
                className="object-contain"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-black text-sm text-mana-ink leading-tight">
              Instala el panel en tu teléfono
            </h3>
            <p className="text-[12px] text-gray-600 leading-snug mt-0.5">
              Abre el panel como una app: pantalla completa, icono en el home y
              sin tener que escribir la dirección.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Ahora no"
            className="shrink-0 grid place-items-center h-7 w-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="px-4 pb-4 pt-0 space-y-2">
            <div className="rounded-xl bg-gray-50 ring-1 ring-black/5 p-3 space-y-2 text-[12px] text-gray-700">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-white ring-1 ring-black/10 shrink-0">
                  <Share className="h-3.5 w-3.5 text-sky-600" />
                </span>
                <span>
                  Toca el botón <strong>Compartir</strong> en la barra de Safari
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-white ring-1 ring-black/10 shrink-0">
                  <Plus className="h-3.5 w-3.5 text-sky-600" />
                </span>
                <span>
                  Elige <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                </span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full text-[12px] font-semibold text-gray-500 hover:text-gray-800 py-1.5"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              disabled={!deferred}
              className="flex-[1.3] inline-flex items-center justify-center gap-1.5 rounded-full bg-mana-red px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 transition disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar app
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
