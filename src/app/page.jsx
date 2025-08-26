"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaTelegramPlane } from "react-icons/fa";
import { LuShieldCheck, LuMic, LuMessageSquare, LuSun, LuCloudSun, LuLeaf, LuSmile } from "react-icons/lu";

// ====== Config ======
const BOT_NAME = "psycho_support_bot"; // TODO: set your bot name without @
const MOBILE_SOFFER_DELAY_MS = 30000; // 30s
const MAX_START_LEN = 64; // payload length limit per spec

// ====== Utils ======
function toBase64UrlSafe(str) {
  try {
    const b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch (e) {
    console.warn("Base64 encoding failed", e);
    return "";
  }
}

function parseUTM() {
  const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const utm = {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_content: p.get("utm_content") || "",
    utm_term: p.get("utm_term") || "",
    adset: p.get("adset") || p.get("utm_adset") || "",
    creative: p.get("creative") || "",
  };
  const click_id = p.get("click_id") || p.get("yclid") || p.get("vk_click_id") || p.get("tg_click_id") || randId();
  return { utm, click_id };
}

function buildTgLink({ utm, click_id, extra = {} }) {
  const compact = {
    i: click_id,
    s: utm.utm_source || undefined,
    m: utm.utm_medium || undefined,
    c: utm.utm_campaign || undefined,
    a: utm.adset || utm.utm_term || undefined,
    v: utm.creative || utm.utm_content || undefined,
    ...extra,
  };
  Object.keys(compact).forEach((k) => compact[k] === undefined && delete compact[k]);
  const dropOrder = ["m", "v", "a", "s", "c"];
  let encoded = toBase64UrlSafe(JSON.stringify(compact));
  let idx = 0;
  while (encoded.length > MAX_START_LEN && idx < dropOrder.length) {
    const key = dropOrder[idx++];
    if (key in compact) {
      delete compact[key];
      encoded = toBase64UrlSafe(JSON.stringify(compact));
    }
  }
  return `https://t.me/${BOT_NAME}?start=${encoded}`;
}

function randId() { return Math.random().toString(36).slice(2, 10); }
function isMobile() { return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches; }
function track(event, props = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...props });
  if (window.gtag) window.gtag("event", event, props);
  if (process.env.NODE_ENV !== "production") console.debug("track:", event, props);
}
function scrollToId(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }

// ====== Quick Exercise Component ======
function QuickExercise({ onComplete }) {
  const [step, setStep] = useState(1);
  const [left, setLeft] = useState(60);
  const [rating, setRating] = useState(null);
  const [checks, setChecks] = useState([]);

  useEffect(() => { track("quick_exercise_start", {}); }, []);
  useEffect(() => { if (step === 1) setLeft(60); if (step === 2) setLeft(120); if (step === 3) setLeft(120); }, [step]);
  useEffect(() => {
    if (step === 4) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(t); setStep((prev) => (prev === 3 ? 4 : (prev + 1))); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);
  
  const percent = useMemo(() => { 
    const total = step === 1 ? 60 : step === 2 ? 120 : step === 3 ? 120 : 1; 
    return step === 4 ? 100 : Math.round(((total - left) / total) * 100); 
  }, [step, left]);
  
  const finish = () => { 
    track("quick_exercise_complete", { duration_s: 60 + 120 + 120 }); 
    onComplete(); 
  };

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-md">
      {step <= 3 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Шаг {step} из 3</span>
            <span>Осталось: {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-[#229ED9] transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="text-center">
          <h4 className="mb-2 text-xl font-semibold">4–6 — вдох, 6–8 — выдох</h4>
          <p className="mb-6 text-[#4B5563]">Дышим ровно 60 секунд. Без анимации и отвлечений.</p>
          <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#E5E7EB]">
            <div className="h-full w-1/4 animate-pulse bg-[#229ED9]"/>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="text-center">
          <h4 className="mb-2 text-xl font-semibold">Назовите 3 вещи, которые видите/слышите/чувствуете</h4>
          <p className="mb-4 text-[#4B5563]">Мягкое заземление. Заметьте детали вокруг.</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {["Что вижу?", "Что слышу?", "Что чувствую телом?"].map((q) => (
              <li key={q} className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700">{q}</li>
            ))}
          </ul>
        </div>
      )}

      {step === 3 && (
        <div>
          <h4 className="mb-2 text-center text-xl font-semibold">Что в зоне вашего контроля до завтра?</h4>
          <div className="space-y-3">
            {[
              "Лёгкая прогулка 10–15 минут",
              "Дыхание перед сном 5 минут",
              "Сообщение близкому человеку",
            ].map((opt) => (
              <label key={opt} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                <input 
                  type="checkbox" 
                  className="h-5 w-5 rounded border-gray-300 text-[#229ED9] focus:ring-[#229ED9]" 
                  checked={checks.includes(opt)} 
                  onChange={(e) => setChecks((prev) => (e.target.checked ? [...prev, opt] : prev.filter((x) => x !== opt)))} 
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center">
          <h4 className="mb-2 text-xl font-semibold">Как сейчас по шкале 0–10?</h4>
          <input 
            type="range" 
            min={0} 
            max={10} 
            value={rating ?? 5} 
            onChange={(e) => setRating(Number(e.target.value))} 
            className="w-full accent-[#229ED9]" 
            aria-label="Оценка состояния" 
          />
          <div className="mt-2 text-sm text-[#4B5563]">Ваш ответ: {rating ?? 5}</div>
          <div className="mt-6">
            <button 
              onClick={finish} 
              className="tap inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-5 py-3 text-white font-semibold shadow-sm hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]"
            >
              <FaTelegramPlane className="h-5 w-5" /> Продолжить в Telegram
            </button>
          </div>
          <p className="mt-3 text-xs text-[#4B5563]">Сервис не является медицинской услугой и не ставит диагнозов. При угрозе жизни/здоровью — 112.</p>
        </div>
      )}
    </div>
  );
}

function ExerciseModal({ open, onClose, onDone }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative">
        <button 
          onClick={onClose} 
          aria-label="Закрыть" 
          className="absolute -top-3 -right-3 rounded-full bg-white px-3 py-1 text-sm shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]"
        >
          ✕
        </button>
        <QuickExercise onComplete={onDone} />
      </div>
    </div>
  );
}

// ====== Reusable UI ======
function PrimaryCTA({ href, position, tab, analytics, children }) {
  return (
    <a
      href={href}
      onClick={() => track("cta_click", { position, tab: tab || null, utm: analytics.utm, click_id: analytics.click_id })}
      className="tap inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-5 py-3 text-white font-semibold shadow-sm hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9] sm:w-auto"
      data-qa={`cta_${position}`}
    >
      <FaTelegramPlane aria-hidden className="h-5 w-5" />
      <span>{children || "Запустить в Telegram"}</span>
    </a>
  );
}

function SecondaryLink({ onClick, children }) {
  return (
    <button onClick={onClick} className="tap inline-flex items-center gap-2 text-[#229ED9] font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]">{children}</button>
  );
}

// ====== Main Page ======
export default function SupportBotLanding() {
  const [activeTab, setActiveTab] = useState("crisis");
  const [utmBundle] = useState(() => parseUTM());
  const [scrolled, setScrolled] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);

  const tgLink = useMemo(() => buildTgLink({ utm: utmBundle.utm, click_id: utmBundle.click_id }), [utmBundle]);

  // SEO
  useEffect(() => {
    document.title = "Поддержка в Telegram за 30 секунд — бережный бот (анонимно)";
  }, []);

  // Scroll + sticky header shadow
  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 4); };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Handlers
  const onHeroSecondary = () => { setActiveTab("crisis"); scrollToId("flows"); };
  const onExerciseComplete = () => { 
    setExerciseOpen(false); 
    window.location.href = tgLink; 
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7FAFC] to-[#F4EDE4] text-[#111827] pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md ${scrolled ? "shadow-sm" : ""}`}>
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between py-3">
          <a href="#top" className="flex items-center gap-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#B8E7E1] text-[#229ED9]">TG</span>
            <span>Support Bot</span>
          </a>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#benefits" className="hover:text-[#229ED9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]">Как помогает</a>
            <a href="#inside" className="hover:text-[#229ED9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]">Что внутри</a>
            <a href="#pricing" className="hover:text-[#229ED9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]">Тарифы</a>
            <a href="#safety" className="hover:text-[#229ED9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]">Безопасность</a>
            <a href="#faq" className="hover:text-[#229ED9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]">FAQ</a>
          </nav>
          <div className="hidden md:block min-w-[220px]">
            <PrimaryCTA href={tgLink} position="header" tab={activeTab} analytics={utmBundle} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">Когда тяжело — не оставайтесь одни. <span className="text-[#229ED9]">Поддержка в Telegram за 30 секунд</span></h1>
          <ul className="mt-4 space-y-2 text-[#111827]">
            <li>• Тёплый диалог и короткие практики</li>
            <li>• Анонимно, без регистрации и оценок</li>
            <li>• Быстрый старт: 1 клик — и мы рядом</li>
          </ul>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <PrimaryCTA href={tgLink} position="hero" tab={activeTab} analytics={utmBundle} />
            <SecondaryLink onClick={onHeroSecondary}>Пройти 5‑минутное упражнение бесплатно</SecondaryLink>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#4B5563]">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Анонимно</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">24/7</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Триал доступен</span>
          </div>
          <p className="mt-3 text-xs text-[#4B5563]">Сервис не является медицинской услугой и не ставит диагнозов. При угрозе жизни/здоровью — 112 и местные службы.</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-[20px] bg-white p-4 shadow-md">
            <div className="mb-3 text-xs text-[#4B5563]">Пример диалога</div>
            <div className="space-y-2">
              <div className="max-w-[85%] rounded-2xl bg-[#F1F5F9] p-3 text-sm text-gray-800">Иногда тревожно по вечерам, не могу уснуть.</div>
              <div className="ml-auto max-w-[85%] rounded-2xl bg-[#229ED9] p-3 text-sm text-white">Я рядом. Хотите быстрое упражнение (3–5 мин) или спокойно разобраться?</div>
              <div className="max-w-[85%] rounded-2xl bg-[#F1F5F9] p-3 text-sm text-gray-800">Давайте короткое упражнение.</div>
              <div className="ml-auto max-w-[85%] rounded-2xl bg-[#229ED9] p-3 text-sm text-white">Окей. Начнём с дыхания 4–6. Я буду подсказывать шаги.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs: flows */}
      <section id="flows" className="max-w-[1200px] mx-auto px-4 py-8">
        <div role="tablist" aria-label="Потоки" className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
          {[
            { key: "crisis", label: "Мне плохо прямо сейчас" },
            { key: "explore", label: "Хочу спокойно разобраться" },
          ].map((t) => (
            <button key={t.key} role="tab" aria-selected={activeTab === t.key} onClick={() => setActiveTab(t.key)} className={`tap flex-1 rounded-lg px-4 py-3 text-sm font-medium transition ${activeTab === t.key ? "bg-[#229ED9] text-white" : "bg-transparent text-gray-700 hover:bg-[#F7FAFC]"}`}>{t.label}</button>
          ))}
        </div>

        <div role="tabpanel" className="mt-6">
          {activeTab === "crisis" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:-translate-y-1 transition-transform duration-200">
                <h3 className="text-xl font-semibold">Срочный режим: 5 минут, чтобы стать устойчивее</h3>
                <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm text-gray-700">
                  <li>Выдох и заземление — 60 секунд</li>
                  <li>Найти опору — 2 минуты</li>
                  <li>Что под контролем — 2 минуты</li>
                </ol>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button 
                    onClick={() => setExerciseOpen(true)} 
                    className="tap rounded-xl bg-[#229ED9] px-5 py-3 font-semibold text-white"
                  >
                    Запустить упражнение
                  </button>
                  <a href={tgLink} onClick={() => track("cta_click", { position: "crisis_secondary", tab: "crisis" })} className="tap rounded-xl border border-[#229ED9] px-5 py-3 text-center font-semibold text-[#229ED9]">Сохранить в Telegram</a>
                </div>
                <p className="mt-3 text-xs text-[#4B5563]">Можно сделать паузу в любой момент.</p>
              </div>
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:-translate-y-1 transition-transform duration-200">
                <h4 className="text-lg font-semibold">Что вы почувствуете после 5 минут</h4>
                <ul className="mt-3 list-disc pl-6 text-sm text-gray-700">
                  <li>Дыхание выровняется, мысли замедлятся</li>
                  <li>Появится ощущение опоры и контроля</li>
                  <li>План из 1–2 простых шагов на сегодня</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:-translate-y-1 transition-transform duration-200">
                <h3 className="text-xl font-semibold">Уточним запрос — подберём практики</h3>
                <p className="mt-2 text-sm text-gray-700">Пройдите короткий квиз из 3 вопросов, чтобы получить персональные рекомендации.</p>
                <div className="mt-6">
                  <PrimaryCTA href={tgLink} position="flows" tab={"explore"} analytics={utmBundle}>Запустить в Telegram</PrimaryCTA>
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:-translate-y-1 transition-transform duration-200">
                <h4 className="text-lg font-semibold">Персональный набор практик</h4>
                <p className="mt-2 text-sm text-gray-700">После квиза предложим 2–3 шага, подходящих под ваш запрос.</p>
                <ul className="mt-4 list-inside list-disc text-sm text-gray-700">
                  <li>Короткое дыхание (5 минут)</li>
                  <li>Упражнение на заземление</li>
                  <li>Диалог для прояснения чувств</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Inside the bot */}
      <section id="inside" className="bg-white py-12">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">Что внутри бота</h2>
          <div className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 text-sm hover:-translate-y-1 transition-transform duration-200">
              <div className="mb-2 font-semibold"><LuLeaf className="mr-2 inline h-5 w-5 text-[#229ED9]"/>Практики 5–10 минут</div>
              Дыхание 4–6, заземление «3 вещи», короткие фокус‑упражнения.
            </div>
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 text-sm hover:-translate-y-1 transition-transform duration-200">
              <div className="mb-2 font-semibold"><LuMessageSquare className="mr-2 inline h-5 w-5 text-[#229ED9]"/>Тёплый диалог</div>
              Вопросы без оценок, чтобы услышать себя и сделать маленький шаг.
            </div>
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 text-sm hover:-translate-y-1 transition-transform duration-200">
              <div className="mb-2 font-semibold"><LuSun className="mr-2 inline h-5 w-5 text-[#229ED9]"/>Наблюдение прогресса</div>
              Отметки настроения, сохранение практик, план на неделю.
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-12">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">Попробуйте сейчас — это займёт 30 секунд</h2>
          <div className="mt-6"><PrimaryCTA href={tgLink} position="final" tab={null} analytics={utmBundle} /></div>
          <p className="mt-2 text-sm text-[#4B5563]">Анонимно. Безопасно. Можно отменить в любой момент.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-10 text-sm text-[#4B5563]">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#B8E7E1] text-[#229ED9]">TG</span>
            <span>Support Bot · 18+</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a className="hover:text-[#229ED9]" href="/privacy">Политика конфиденциальности</a>
            <a className="hover:text-[#229ED9]" href="/terms">Пользовательское соглашение</a>
            <a className="hover:text-[#229ED9]" href="/contacts">Контакты</a>
          </div>
        </div>
      </footer>

      {/* Exercise modal instance */}
      <ExerciseModal 
        open={exerciseOpen} 
        onClose={() => setExerciseOpen(false)} 
        onDone={onExerciseComplete} 
      />
    </div>
  );
}
