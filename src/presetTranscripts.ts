export interface PresetSample {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
}

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "tech-weekly",
    title: "AI 產品開發團隊週會記錄",
    category: "科技與工程",
    description: "涉及 AI 模型串接、前端 UI 設計調整、API 錯誤處理以及時程壓力的討論。",
    content: `阿明（主持人/產品經理）：好，大家早。今天我們來對一下「AI 會議記錄工具」這款新產品的開發進度。目前最核心的 Gemini API 串接狀況怎麼樣？
小林（後端工程師）：API 串接部分，我已經依照最新的 @google/genai SDK 規範，把核心邏輯都移到 Express server 處理了。這樣可以保護我們的 API Key 不會暴露在前端。另外我加上了 headers "User-Agent": "aistudio-build" 以利追蹤。
雅婷（前端工程師）：太好了！那我前端呼叫 \`/api/summarize\` 就很單純了，再也不用擔心 Key 外流。不過我有個問題，如果使用者上傳了超長逐字稿（例如大於 50,000 字），Gemini 3.5 Flash 的處理速度大約多久？前端要怎麼設計 Loading 畫面給使用者比較合適？
小林：根據我昨天的壓力測試，Gemini 3.5 Flash 速度滿快的，大部分 2 萬字以內在 8-12 秒即可吐出完整 summary。但如果是超長文字，大概需要 15 秒。所以我建議前端做一個「進度百分比、或是具有安慰語氣的載入狀態」，不要只轉圈圈，不然使用者會以為網頁當掉。
雅婷：了解！那我會用 motion/react 寫一個有「微光呼吸漸變、並且動態顯示工作進度（如：分析音效中、淬取重點關鍵詞、生成待辦清單中...）」的高質感 Loading 卡片。
阿明：很好，這點使用者體驗很重要。那時程上，下週三能不能把整個流程走通進到 Alpha 測試？
老張（QA專員）：這部分我下週一開始手動測試前端各極端案例（例如貼入全空白、貼入不相關的程式碼、甚至是貼入多種混合語言如中英日混合）。預計下週二晚上可以整理出第一版 Bug list 給雅婷和小林修復。
小林：我沒問題。
雅婷：只要小林 API 給的格式固定且含有詳細的代辦清單標題，我都可以在下週一一併完成整合。
阿明：收到！那今天的結論就是：
1. 小林負責穩固後端 API 路由並加入大封包保護，下週一前交付給前端。
2. 雅婷使用 Tailwind CSS 完成包含一鍵複製、Markdown 渲染、以及高質感動態 Loading 畫面的單頁精緻介面。
3. 老張下週一、二進行全面深度測試、確保 robustness。
4. 下週三，我們會向全團隊進行 Alpha 內部展示。今天會議到這邊，謝謝。`,
  },
  {
    id: "marketing-strategy",
    title: "2026 Q3 全球行銷策略與預算規劃會議",
    category: "行銷與商務",
    description: "討論社交媒體投放策略、KOL 合作預算，以及轉換率、KPI 目標的跨部門協作。",
    content: `Eva（Chief Marketing Officer）: Morning everyone. Today we are setting the direction for Q3 marketing strategies and aligning budgets. We need to decide how to split the budget between paid social, KOL campaigns, and SEO/content writing.
Danny (Marketing Specialist): For paid socials, based on Q2 metrics, Instagram CPC has increased by 15%, but TikTok visual formats are yielding 25% higher CTR. Therefore, I propose diverting 10% of our Facebook ad budget purely into TikTok short-form dynamic videos.
Sarah (Creative Director): I agree. Our creative team has mockups ready for vertical dynamic videos. However, TikTok campaigns live and die on music choice and trends. We need to use engaging, rhythmic soundbeds.
Jason (Finance/Analyst): Wait, before we shift the money, what are the exact performance indicators we are chasing for Q3? If we move budget to TikTok, do we expect direct e-commerce sales, or is this purely a brand awareness uplift?
Danny: In Q3, our focus is twofold: traffic acquisition and brand reach. We are targeting a 20% overall conversion rate increase from lead-capture forms, which we will embed alongside the TikTok campaigns.
Eva: Jason, can we allocate an additional $15,000 for local influencer pairings in East Asia? Specifically in Taipei and Tokyo? Our local teams are reporting strong interest.
Jason: Based on Q2 surplus, we can approve $12,000 for East Asia, but it has to be split: $7,000 for Taipei and $5,000 for Tokyo. The Tokyo agency must provide localized reporting by September 15th.
Eva: That is fair. Let's write down the agreements:
- Danny shifts 10% FB budget to TikTok, setting up conversion tracking.
- Sarah's team starts production on short-form vertical assets by end of next week.
- local managers prepare Japanese/Taiwanese KOL shortlist with the approved $12k split.
- Jason will draft the revised Q3 budget spreadsheet by Friday afternoon.
Thank you team, let's keep the focus high!`,
  },
  {
    id: "design-system",
    title: "跨部門 UI 設計系統與體驗優化討論會",
    category: "設計與體驗",
    description: "關於暗色模式配色規範、無障礙設計（A11y）合規標準，以及組件封裝規範的激烈討論。",
    content: `大雄（設計組長）：大家都知道我們最近在重構整套應用程式的 UI 介面，今天要拍板定案的是「設計系統的黑白平衡與無障礙（A11y）對比度規範」。
靜香（資深 UI 設計師）：我重新調整過主要品牌的深色背景，目前選定以 Slate 煤灰色（深灰偏藍）為主軸，它比純黑更適合長時間觀看，能有效減少眼部疲勞。此外，所有的文字也都有經過 AA 級無障礙（A11y）對比度測試，主文字與背景比大於 4.5:1。
胖虎（資深前端工程師）：太棒了！我很討厭那種純黑 000000 的背景，切換時眼睛很不舒服。不過這套色碼（Color token）是不是已經整理進 Tailwind config 的擴充屬性了？
靜香：是的，我都已經整合並發布到 Figma Token 表了。包含：主要色 \`--color-primary\`、背景色 \`--background-slate\` 與中性色。下週一前我會匯出成 JSON 檔給你。
阿福（專案經理）：那關於組件，各平台的共用狀況如何？在 React 19 與 Vite 環境下，組件載入效能有需要特別注意的嗎？
胖虎：只要靜香給的 Token 變數夠標準，我可以直接套用 Tailwind v4 的 CSS 變數設計。我們目前的元件庫有按功能打包（Code-splitting），所以首頁加載小於 100ms。唯一要注意的是，當使用者切換特定分頁時，可能會有畫面閃爍（Layout shift）的問題。
大雄：這個雅婷有提過，可以使用 \`motion/react\` 加上 \`layoutId\` 來做流暢過渡（Spring transition），就能消除任何瞬間的位移感。
胖虎：沒問題，那這部分的動效我會在一併實作時加上，下週二下班前先上線到 Staging 環境。
阿福：好，我彙整今天的結論與後續執行步驟：
1. 靜香在下週一中午前匯出 JSON 色碼 Token，並核對所有 A11y 標題與圖示的無障礙對比。
2. 胖虎收到 JSON 後，在 24 小時內匯入 Tailwind 配置，並針對 A11y 合規標準封裝第一版 Button 和 Card 組件。
3. 胖虎在下週二下班前，結合 \`motion/react\` 轉場效果上線 Staging 給內部評測。
4. 下週三早會驗收。感謝大家。`
  }
];
