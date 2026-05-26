import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  Sparkles, 
  Languages, 
  FileText, 
  Clipboard, 
  ClipboardCheck, 
  Trash2, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Settings,
  RefreshCw,
  Cpu,
  Zap,
} from "lucide-react";
import { PRESET_SAMPLES, PresetSample } from "./presetTranscripts";

// ── Provider config ──────────────────────────────────────────────────────────
type Provider = "gemini" | "nvidia";

const PROVIDERS: {
  id: Provider;
  label: string;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    badge: "Gemini 2.5 Flash Lite",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-500",
    ringColor: "ring-indigo-100",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    badge: "Nemotron Mini 4B",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-500",
    ringColor: "ring-emerald-100",
    icon: <Cpu className="w-4 h-4" />,
  },
];

export default function App() {
  // ── Input state ────────────────────────────────────────────────────────────
  const [transcript, setTranscript] = useState<string>("");
  const [optionLength, setOptionLength] = useState<string>("標準詳細度");
  const [optionTone, setOptionTone] = useState<string>("專業商務");
  const [targetLanguage, setTargetLanguage] = useState<string>("英文 (English)");
  const [customFocus, setCustomFocus] = useState<string>("");
  const [provider, setProvider] = useState<Provider>("gemini");

  // ── App running state ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeSampleId, setActiveSampleId] = useState<string>("");

  // ── Derived ────────────────────────────────────────────────────────────────
  const charCount = transcript.trim().length;
  const wordEstimate = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const activeProvider = PROVIDERS.find((p) => p.id === provider)!;

  // ── Loading steps ──────────────────────────────────────────────────────────
  const LOADING_STEPS_GEMINI = [
    "正在連線安全的 Google Gemini AI 雲端服務...",
    "正在通讀並解析您貼上的會議逐字稿內容...",
    "正在篩選重疊、發言助詞與冗餘對話資訊...",
    "正在梳理發言角色關係，提取主要討論重點...",
    "正在歸納出核心議題與共識決議事項...",
    "正在整理 Markdown 代辦清單及對應指派人...",
    "正在將會議記錄對照精準翻譯成 " + targetLanguage + "...",
    "最後潤色，正為您呈現美觀且專業的排版報告...",
  ];

  const LOADING_STEPS_NVIDIA = [
    "正在連線 NVIDIA NIM AI 雲端推論平台...",
    "正在通讀並解析您貼上的會議逐字稿內容...",
    "Nemotron 模型正在提取會議關鍵資訊...",
    "正在梳理發言角色關係，提取主要討論重點...",
    "正在歸納出核心議題與共識決議事項...",
    "正在整理 Markdown 代辦清單及對應指派人...",
    "正在將會議記錄對照精準翻譯成 " + targetLanguage + "...",
    "最後潤色，正為您呈現美觀且專業的排版報告...",
  ];

  const LOADING_STEPS = provider === "nvidia" ? LOADING_STEPS_NVIDIA : LOADING_STEPS_GEMINI;

  // ── Loading message rotator ─────────────────────────────────────────────
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (loading) {
      intervalId = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, targetLanguage, provider]);

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript || transcript.trim() === "") {
      setError("請在左側輸入框中輸入或貼上會議逐字稿內容。");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setLoadingMessageIndex(0);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          transcript,
          optionLength,
          optionTone,
          targetLanguage,
          customFocus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失敗，請檢查系統設定或 API 回應。");
      }

      setResult(data.result);
      setTimeout(() => {
        const resultEl = document.getElementById("analysis-result-section");
        if (resultEl) resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "伺服器通訊錯誤，請確認設定是否正常。";
      console.error(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    let fileName = `會議精華與翻譯_${dateStr}.md`;
    if (activeSampleId) {
      const activeSample = PRESET_SAMPLES.find((s) => s.id === activeSampleId);
      if (activeSample) fileName = `${activeSample.title}_精華總結.md`;
    }
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyPreset = (sample: PresetSample) => {
    setTranscript(sample.content);
    setCustomFocus("");
    setActiveSampleId(sample.id);
    setError("");
    if (sample.id === "marketing-strategy") {
      setTargetLanguage("繁體中文對照 (zh-TW)");
      setOptionTone("行動與共識導向");
    } else if (sample.id === "design-system") {
      setTargetLanguage("英文 (English)");
      setOptionTone("工程與科技感");
    } else {
      setTargetLanguage("英文 (English)");
      setOptionTone("專業商務");
    }
    const textareaEl = document.getElementById("transcript-textarea");
    if (textareaEl) textareaEl.focus();
  };

  const handleClear = () => {
    setTranscript("");
    setActiveSampleId("");
    setError("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col antialiased">

      {/* ── Header ── */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 rounded-xl shadow-md text-white">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
                AI 會議記錄生成與翻譯工具
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                會議逐字稿深度淬取 • 重點行動萃取 • 多語智能對照
              </p>
            </div>
          </div>

          {/* Active provider badge */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div
              className={`flex items-center gap-2 ${activeProvider.bgColor} border ${activeProvider.borderColor}/30 rounded-full px-4 py-1.5 text-xs ${activeProvider.color} font-semibold shadow-xs transition-all duration-300`}
            >
              <span className={`w-2 h-2 rounded-full ${provider === "gemini" ? "bg-indigo-500" : "bg-emerald-500"} animate-ping`} />
              {activeProvider.icon}
              {activeProvider.badge} 驅動
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">

        {/* ── LEFT COLUMN ── */}
        <section className="lg:col-span-6 flex flex-col gap-6" id="input-control-panel">

          {/* Preset samples */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              第一步：選擇預設會議逐字稿（快速體驗）
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              若手邊沒有現成的會議記錄，請點選下方精心設計的真實會議模擬，一鍵自動填充並配置最合適的首選設定參數：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESET_SAMPLES.map((sample) => {
                const isActive = activeSampleId === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => handleApplyPreset(sample)}
                    type="button"
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 truncate mb-1 flex items-center justify-between w-full">
                      {sample.title}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 ml-1" />}
                    </span>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/50 rounded px-1 w-max mb-1 font-semibold">
                      {sample.category}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-normal">
                      {sample.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                第二步：輸入或修改您的會議逐字稿
              </span>
              {transcript && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空內容
                </button>
              )}
            </h2>

            {/* Textarea */}
            <div className="relative">
              <textarea
                id="transcript-textarea"
                rows={12}
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  if (activeSampleId) setActiveSampleId("");
                  setError("");
                }}
                placeholder="在此貼上您要解析的會議英文、中文、或中英文混雜之會議原始逐字稿（Transcript）、即時對談紀錄或粗糙的速記點..."
                className="w-full rounded-xl border border-slate-200 p-4 font-sans text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-white/95 backdrop-blur-xs border border-slate-150 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 shadow-xs">
                <span className="flex items-center gap-1">
                  字數: <strong className="text-slate-700 font-mono">{charCount}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">
                  估算字詞數: <strong className="text-slate-700 font-mono">{wordEstimate}</strong>
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              <Settings className="w-4 h-4 text-indigo-500" />
              第三步：智能客製化設定 (AI Customization)
            </div>

            {/* ── AI Provider Selection ── */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  AI 服務提供商
                </span>
                <span className="text-[10px] text-slate-400 font-normal">AI Provider</span>
              </label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="AI 服務提供商">
                {PROVIDERS.map((p) => {
                  const isSelected = provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      id={`provider-btn-${p.id}`}
                      onClick={() => setProvider(p.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? `${p.borderColor} ${p.bgColor} ${p.color} ring-2 ${p.ringColor} shadow-sm`
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`${isSelected ? p.color : "text-slate-400"} transition-colors`}>
                        {p.icon}
                      </span>
                      <div className="flex flex-col text-left leading-tight">
                        <span>{p.label}</span>
                        <span className={`text-[9px] font-normal ${isSelected ? "opacity-80" : "text-slate-400"}`}>
                          {p.badge}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ml-auto ${p.color}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customizers grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Length */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  記錄長度模式
                  <span className="text-[10px] text-slate-400 font-normal">Summary Depth</span>
                </label>
                <select
                  value={optionLength}
                  onChange={(e) => setOptionLength(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="精簡概要">精簡概要 （主幹條列）</option>
                  <option value="標準詳細度">標準詳細度 （結構均衡）</option>
                  <option value="極致詳細記錄">極致詳細記錄 （不漏任何細節）</option>
                </select>
              </div>

              {/* Tone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  記錄語氣風格
                  <span className="text-[10px] text-slate-400 font-normal">Writing Style</span>
                </label>
                <select
                  value={optionTone}
                  onChange={(e) => setOptionTone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="專業商務">專業商務 （公正客觀、高管適用）</option>
                  <option value="行動與共識導向">行動共識導向 （專注對策、追蹤事項）</option>
                  <option value="工程與科技感">工程技術感 （細讀程式與架構）</option>
                </select>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  翻譯目標語言
                  <span className="text-[10px] text-slate-400 font-normal">Translation Target</span>
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="英文 (English)">英文 (English)</option>
                  <option value="日文 (Japanese)">日文 (Japanese)</option>
                  <option value="韓文 (Korean)">韓文 (Korean)</option>
                  <option value="西班牙文 (Spanish)">西班牙文 (Spanish)</option>
                  <option value="德文 (German)">德文 (German)</option>
                  <option value="法文 (French)">法文 (French)</option>
                  <option value="繁體中文對照 (zh-TW)">繁體中文對照 （中文總結+中文翻譯）</option>
                </select>
              </div>
            </div>

            {/* Custom focus */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>特別關注焦點 <span className="text-[10px] font-normal text-indigo-500">（選填）</span></span>
                <span className="text-[10px] text-slate-400 font-normal">Topic Highlight Focus</span>
              </label>
              <input
                type="text"
                id="custom-focus-input"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="例如：『預算超支、AI介面安全性、雅婷接下來的任務』"
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="generate-btn"
              disabled={loading || !transcript.trim()}
              className={`w-full py-3.5 px-5 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden select-none cursor-pointer ${
                loading
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : !transcript.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : provider === "nvidia"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-[0.98]"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                activeProvider.icon
              )}
              <span>{loading ? "會議重點析取中..." : `開始分析：使用 ${activeProvider.label} 生成總結`}</span>
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>
        </section>

        {/* ── RIGHT COLUMN ── */}
        <section className="lg:col-span-6 flex flex-col" id="analysis-result-section">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[500px]">
            {/* Result header */}
            <div className="border-b border-slate-150 px-6 py-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${result && !loading ? "bg-emerald-500" : "bg-slate-300"}`} />
                <h2 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">
                  AI 分析與翻譯成果區
                </h2>
              </div>

              {result && !loading && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    type="button"
                    id="copy-result-btn"
                    title="一鍵複製 Markdown 格式記錄"
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      copied
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {copied ? (
                      <><ClipboardCheck className="w-3.5 h-3.5" /><span>已複製！</span></>
                    ) : (
                      <><Clipboard className="w-3.5 h-3.5" /><span>一鍵複製</span></>
                    )}
                  </button>
                  <button
                    onClick={handleExport}
                    type="button"
                    id="export-result-btn"
                    title="匯出下載為 Markdown 檔案"
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>匯出 Markdown</span>
                  </button>
                </div>
              )}
            </div>

            {/* Result body */}
            <div className="flex-1 p-6 flex flex-col overflow-y-auto">

              {/* Idle state */}
              {!result && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto my-auto">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full blur-2xl opacity-75 animate-pulse" />
                    <div className="relative bg-indigo-50 border border-indigo-100 p-5 rounded-2xl text-indigo-600 text-6xl shadow-sm">
                      <Sparkles className="w-12 h-12" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">智慧會議筆記已準備就緒</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">
                    請按順序在左側貼上您的會議逐字稿（或直接點擊上方快速體驗範例），選擇 AI 服務提供商，然後點一下「生成總結與翻譯」按鈕。
                  </p>
                  <div className="w-full text-left bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">核心技術優勢</span>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong>多維角色梳理</strong>：自動隔離非關鍵發言與雜訊。</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong>待辦追蹤</strong>：採用標準 Markdown 清單方便對齊。</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong>雙引擎支援</strong>：可切換 Google Gemini 或 NVIDIA Nemotron 模型。</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong>商務多語翻譯</strong>：不失真地轉化為地道商業外語。</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto transition-all duration-300">
                  <div className={`relative mb-8 glow-loading ${provider === "nvidia" ? "text-emerald-600" : "text-indigo-600"}`}>
                    <div className={`absolute inset-x-[-15px] inset-y-[-15px] border-2 ${provider === "nvidia" ? "border-emerald-500/20" : "border-indigo-500/20"} rounded-full animate-ping`} />
                    <div className={`${provider === "nvidia" ? "bg-emerald-600" : "bg-indigo-600"} p-6 rounded-3xl text-white shadow-xl flex items-center justify-center`}>
                      <Languages className="w-10 h-10 animate-pulse" />
                    </div>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
                      <div
                        className={`h-full rounded-full animate-[progress_15s_infinite_linear] ${
                          provider === "nvidia"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gradient-to-r from-indigo-500 to-violet-500"
                        }`}
                        style={{ width: "85%" }}
                      />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-center gap-1.5">
                      <RefreshCw className={`w-4 h-4 animate-spin ${provider === "nvidia" ? "text-emerald-600" : "text-indigo-600"}`} />
                      正在提取並分析會議記錄
                    </h4>
                    <p className={`text-xs ${provider === "nvidia" ? "text-emerald-700 bg-emerald-50 border-emerald-100/50" : "text-indigo-600 bg-indigo-50 border-indigo-100/50"} border rounded-lg px-4 py-2.5 font-medium min-h-[50px] flex items-center justify-center leading-relaxed`}>
                      {LOADING_STEPS[loadingMessageIndex]}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-4 block leading-normal">
                      這將自動過濾背景噪音，通常只需要 10–20 秒。請稍候。
                    </span>
                  </div>
                </div>
              )}

              {/* Result state */}
              {result && !loading && (
                <div className="fade-in-up duration-350">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-4 py-3 mb-6 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold">
                      分析生成成功！使用 <strong>{activeProvider.label}</strong>，已根據：長度「{optionLength}」、語氣「{optionTone}」與指定語系翻譯產出。
                    </span>
                  </div>
                  <div className="markdown-body select-text">
                    <Markdown>{result}</Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full text-center border-t border-slate-200 mt-12 pt-6 shrink-0 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-slate-400 text-xs flex flex-col md:flex-row items-center justify-between gap-4 py-4">
          <span>© 2026 AI 會議記錄生成與翻譯工具. 利用多階段語意整理技術.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              本地時間: {new Date().toLocaleDateString("zh-TW")}
            </span>
            <span className="text-slate-200">|</span>
            <span className="text-slate-400">繁體中文版設計 • Vercel Serverless</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
