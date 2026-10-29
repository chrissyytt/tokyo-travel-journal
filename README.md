# Tokyo Travel Journal

React + TypeScript + Vite + Tailwind CSS 的繁體中文東京旅行手帳。無登入、無後端、無付費服務。行程日期為 2026/11/23–11/27。

## 本機啟動

需要 Node.js 22.12+（建議 Node.js 24 LTS）。

```sh
npm ci
npm run dev
```

開啟終端顯示的網址。正式建置與檢查：

```sh
npm run build
npm run lint
npm test
```

Playwright 測試優先使用 `CHROMIUM_PATH` 指定的執行檔，或已安裝的 `/usr/bin/chromium`。其他環境先執行 `npx playwright install chromium`，即可使用 Playwright 下載的瀏覽器。測試涵蓋手機尺寸、CRUD、IndexedDB 持久化、照片、匯率計算及備份還原。

## 功能與資料

- 五日行程預設收合，支援時間、日期、地址、備註、私人預約資訊、同日上下排序、新增／編輯／刪除。
- 口袋名單：分類、區域、搜尋、篩選、照片及自訂 Google Maps 收藏入口。
- 行李：適合五天四夜與寒冷天氣的預設項目，勾選、取消、增刪改及進度。
- 記帳：TWD／JPY、參考匯率、分類及每日／總合計。初始匯率 0.22 為示例，非即時金融資料。
- 已知費用合計 TWD 18,649。Andy Garden Inn 以提供的總價 8,147 計入一次，保留房費 6,950.25、服務費 1,196 及 0.75 差額說明。未提供費用不編造。
- 地點可開啟 Google Maps／導航；明確地址提供按需載入的嵌入預覽。短網址不擅自猜測座標，導航由 Google Maps 內選取路線。預覽失敗可改用外部連結。未同步私人 Google Maps 收藏。
- JPG／PNG／WebP 上傳後預覽，可寫說明、刪除及放大。長邊縮至最多 1600px，轉為 JPEG（品質 0.78），單張限 30MB。

所有資料與照片使用 Dexie 存於目前瀏覽器 IndexedDB（資料庫 `tokyo-travel-journal`）。既有項目編輯立即自動儲存；新項目完成表單後按儲存。儲存失敗會顯示訊息。清除網站資料或使用不同瀏覽器／網域會得到獨立手帳；換裝置不會自動同步。建議避免無痕模式並定期備份。

「設定與備份」可匯出完整 JSON（含照片、私人欄位、匯率等）。匯入前檢查格式，經確認後整份取代，失敗保留原資料。匯入限 100MB；大型相簿請定期分開保存原照片。備份可能含私人資訊，請妥善保管。

## 隱私

公開程式碼沒有訂位代號或租車預約編號；使用者自行輸入的私人資訊只存本機，不會上傳 GitHub。網站沒有分析追蹤。外部 Google Maps 連結及使用者開啟的地圖 iframe 會連線至 Google。建議部署於自己管理的網域；請勿在共用裝置輸入敏感資料。

## Vercel 部署

1. 在 Vercel 匯入 `chrissyytt/tokyo-travel-journal`。
2. Framework Preset 選 Vite；Install Command `npm ci`；Build Command `npm run build`；Output Directory `dist`。
3. 不需要環境變數。部署後以 HTTPS 開啟即可使用 IndexedDB。
4. 可先部署 PR Preview；本專案不自動合併 PR。正式網域與 Preview 網域的本機資料獨立，請透過備份移轉。

`vercel.json` 已設定 SPA 回退；本網站不使用伺服器 API。首次仍需網路載入網站，未實作離線 Service Worker。
