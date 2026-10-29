import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Heart,
  Luggage,
  Wallet,
  Plus,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Download,
  Upload,
  Settings,
  ExternalLink,
  Navigation,
  Camera,
  Check,
  Pencil,
  Mountain,
  Plane,
  BookOpen,
} from "lucide-react";
import {
  dates,
  expenseCategories,
  packCategories,
  placeCategories,
  safeUrl,
  twd,
  uid,
  type Entry,
  type Expense,
  type Journal,
  type Packing,
  type Photo,
  type Place,
} from "./model";
import {
  compressPhoto,
  loadJournal,
  parseBackup,
  saveJournal,
} from "./storage";
type Tab = "行程" | "口袋名單" | "行李清單" | "記帳";
type Editor =
  | { kind: "entry"; value: Entry }
  | { kind: "place"; value: Place }
  | { kind: "packing"; value: Packing }
  | { kind: "expense"; value: Expense };
const labels = [
  "抵達東京，旅程開始",
  "往富士山的方向",
  "湖畔漫遊，回到東京",
  "把今天交給迪士尼",
  "再見東京，下次見",
];
const money = (n: number) =>
  n.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
export default function App() {
  const [data, setData] = useState<Journal>();
  const current = useRef<Journal | undefined>(undefined);
  const queue = useRef(Promise.resolve());
  const [tab, setTab] = useState<Tab>("行程");
  const [open, setOpen] = useState<string[]>([]);
  const [editor, setEditor] = useState<Editor>();
  const [settings, setSettings] = useState(false);
  const [status, setStatus] = useState("正在開啟手帳…");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    loadJournal()
      .then((d) => {
        current.current = d;
        setData(d);
        setReady(true);
        setStatus("已儲存於此瀏覽器");
      })
      .catch((e) => {
        setError(
          `無法開啟本機資料庫：${String(e)}。請確認瀏覽器允許 IndexedDB，再重新整理。`,
        );
      });
  }, []);
  useEffect(() => {
    if (editor || settings) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [editor, settings]);
  function update(fn: (d: Journal) => Journal) {
    if (!current.current) return;
    const next = fn(current.current);
    current.current = next;
    setData(next);
    setStatus("儲存中…");
    queue.current = queue.current
      .then(() => saveJournal(next))
      .then(() => {
        setStatus("已儲存於此瀏覽器");
      })
      .catch((e) => {
        setStatus("儲存失敗");
        setError(`儲存失敗：${String(e)}。請匯出備份，並檢查儲存空間。`);
      });
  }
  function remove(kind: Editor["kind"], id: string) {
    if (!confirm("確定刪除這一項及其照片？")) return;
    const key = (
      {
        entry: "entries",
        place: "places",
        packing: "packing",
        expense: "expenses",
      } as const
    )[kind];
    update((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
  }

  function changeEditor(key: string, value: unknown) {
    setEditor((e) =>
      e ? ({ ...e, value: { ...e.value, [key]: value } } as Editor) : e,
    );
  }
  function add(kind: Editor["kind"], date = dates[0]) {
    const id = uid();
    if (kind === "entry")
      setEditor({
        kind,
        value: {
          id,
          date,
          time: "",
          name: "",
          address: "",
          notes: "",
          url: "",
          privateInfo: "",
          photos: [],
        },
      });
    if (kind === "place")
      setEditor({
        kind,
        value: {
          id,
          name: "",
          category: "餐廳",
          area: "",
          url: "",
          notes: "",
          photos: [],
        },
      });
    if (kind === "packing")
      setEditor({
        kind,
        value: { id, name: "", category: "其他", done: false },
      });
    if (kind === "expense")
      setEditor({
        kind,
        value: {
          id,
          date,
          name: "",
          amount: 0,
          currency: "TWD",
          category: "其他",
          notes: "",
        },
      });
  }
  function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const key = (
      {
        entry: "entries",
        place: "places",
        packing: "packing",
        expense: "expenses",
      } as const
    )[editor.kind];
    update((d) => {
      const list = d[key] as (Entry | Place | Packing | Expense)[];
      return {
        ...d,
        [key]: list.some((x) => x.id === editor.value.id)
          ? list.map((x) => (x.id === editor.value.id ? editor.value : x))
          : [...list, editor.value],
      };
    });
    setEditor(undefined);
  }
  function editLive(
    kind: Editor["kind"],
    value: Entry | Place | Packing | Expense,
  ) {
    setEditor({ kind, value } as Editor);
  }
  function move(id: string, delta: number) {
    update((d) => {
      const list = [...d.entries];
      const a = list.findIndex((e) => e.id === id);
      const same = list
        .map((e, i) => ({ e, i }))
        .filter((x) => x.e.date === list[a].date);
      const b = same[same.findIndex((x) => x.i === a) + delta]?.i;
      if (b === undefined) return d;
      [list[a], list[b]] = [list[b], list[a]];
      return { ...d, entries: list };
    });
  }
  async function exportBackup() {
    await queue.current;
    const blob = new Blob([JSON.stringify(current.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokyo-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100 * 1024 * 1024)
        throw new Error("備份檔請小於 100 MB。");
      const restored = parseBackup(await file.text());
      if (
        confirm(
          "匯入會取代目前所有資料，包含照片與私人資訊。建議先匯出備份。確定繼續？",
        )
      )
        update(() => restored);
    } catch (e) {
      setError(String(e));
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function upload(files: FileList | null) {
    if (!files || !editor || !("photos" in editor.value)) return;
    setBusy(true);
    try {
      const photos: Photo[] = [];
      for (const file of Array.from(files))
        photos.push({
          id: uid(),
          data: await compressPhoto(file),
          caption: "",
        });
      const next = {
        ...editor.value,
        photos: [...editor.value.photos, ...photos],
      };
      setEditor({ ...editor, value: next } as Editor);
      const key = editor.kind === "entry" ? "entries" : "places";
      if (current.current?.[key].some((x) => x.id === next.id))
        update((d) => ({
          ...d,
          [key]: d[key].map((x) => (x.id === next.id ? next : x)),
        }));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  // Existing records autosave while editing; a new record is added with the form submit.
  function field(key: string, value: unknown) {
    changeEditor(key, value);
    if (!editor) return;
    const next = { ...editor.value, [key]: value };
    const table = (
      {
        entry: "entries",
        place: "places",
        packing: "packing",
        expense: "expenses",
      } as const
    )[editor.kind];
    if (current.current?.[table].some((x) => x.id === next.id))
      update((d) => ({
        ...d,
        [table]: d[table].map((x) => (x.id === next.id ? next : x)),
      }));
  }
  const total = data?.expenses.reduce((s, e) => s + twd(e, data.rate), 0) || 0;
  const completed = data?.packing.filter((x) => x.done).length || 0;
  const progress = data?.packing.length
    ? Math.round((completed / data.packing.length) * 100)
    : 0;
  return (
    <>
      <header className="topbar">
        <a href="#" className="brand">
          <span className="brand-mark">
            <BookOpen size={20} />
          </span>
          <span>
            Tokyo Travel Journal<small>一冊，屬於我們的東京。</small>
          </span>
        </a>
        <button
          className="icon"
          aria-label="設定與備份"
          onClick={() => setSettings(true)}
          disabled={!ready}
        >
          <Settings size={20} />
        </button>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">OUR LITTLE JAPAN ESCAPE</p>
            <h1>
              Tokyo,
              <br />
              with love <span>♡</span>
            </h1>
            <p className="intro">
              把想去的地方，和沿途的小美好，
              <br />
              都好好收進這一趟旅行。
            </p>
            <div className="trip-date">
              <span className="dot" />
              2026.11.23 — 11.27 <span className="divider">/</span> 五天四夜
            </div>
          </div>
          <div className="postcard" aria-label="富士山旅行插畫">
            <div className="postcard-inside">
              <span className="stamp">
                JAPAN
                <br />
                日本
              </span>
              <svg viewBox="0 0 400 270" role="img" aria-label="富士山與湖泊">
                <circle cx="301" cy="68" r="29" fill="#e3c560" />
                <path
                  d="M0 221 Q80 160 155 202 T400 180 V270 H0Z"
                  fill="#d8ded3"
                />
                <path d="M69 220 205 50 345 220Z" fill="#a2b4bb" />
                <path
                  d="m205 50-51 64 25-8 16 13 17-16 23 10 22 0Z"
                  fill="#fffdf6"
                />
                <path
                  d="M0 220 Q130 192 250 221 T400 220 V270 H0Z"
                  fill="#c0d4d3"
                />
                <path
                  d="M142 243 Q210 237 273 244M183 256h71"
                  stroke="#edf2e9"
                  fill="none"
                  strokeWidth="3"
                />
                <path
                  d="M34 220v-72m-22 18 22-30 23 30m-43 16 20-29 21 29m-44 18 23-31 24 31"
                  stroke="#637f70"
                  fill="none"
                  strokeWidth="9"
                />
              </svg>
              <span className="postcard-caption">a little closer to Fuji.</span>
            </div>
            <span className="tape" />
          </div>
        </section>
        <section className="summary-grid">
          <div>
            <span className="summary-icon rose">
              <Plane size={19} />
            </span>
            <p>
              下一站，日本<strong>東京・富士山</strong>
            </p>
          </div>
          <div>
            <span className="summary-icon yellow">
              <Luggage size={19} />
            </span>
            <p>
              行李準備
              <strong>
                {progress}% <small>已完成</small>
              </strong>
            </p>
          </div>
          <div>
            <span className="summary-icon green">
              <Wallet size={19} />
            </span>
            <p>
              已記錄支出
              <strong>
                <small>NT$</small> {money(total)}
              </strong>
            </p>
          </div>
        </section>
        <div className="desktop-tabs">
          {(["行程", "口袋名單", "行李清單", "記帳"] as Tab[]).map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => {
                setTab(t);
                setFilter("全部");
                setQuery("");
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div role="status" className="save-status">
          <span className="dot" />
          {status}
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
            <button
              className="icon"
              aria-label="關閉錯誤訊息"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {data && (
          <section className="content">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {tab === "行程"
                    ? "THE ITINERARY"
                    : tab === "口袋名單"
                      ? "SAVED FOR LATER"
                      : tab === "行李清單"
                        ? "PACK A LITTLE HAPPINESS"
                        : "LITTLE THINGS, ALL COUNTED"}
                </p>
                <h2>
                  {tab === "行程"
                    ? "旅途，慢慢展開"
                    : tab === "口袋名單"
                      ? "把喜歡的，先收藏"
                      : tab === "行李清單"
                        ? "帶上期待，也帶上溫暖"
                        : "每一筆，都是旅行的足跡"}
                </h2>
                <p>
                  {tab === "行程"
                    ? "五天的東京與富士山，留一些空白給驚喜。"
                    : tab === "口袋名單"
                      ? "想吃的、想逛的，下次就從這裡出發。"
                      : tab === "行李清單"
                        ? "11 月下旬的東京與富士山周邊可能寒冷，記得分層保暖。"
                        : "日圓換算為參考台幣金額，實際請以刷卡或換匯紀錄為準。"}
                </p>
              </div>
              <button
                className="primary"
                onClick={() =>
                  add(
                    tab === "行程"
                      ? "entry"
                      : tab === "口袋名單"
                        ? "place"
                        : tab === "行李清單"
                          ? "packing"
                          : "expense",
                  )
                }
              >
                <Plus size={17} />
                <span>
                  新增
                  {tab === "行程"
                    ? "行程"
                    : tab === "口袋名單"
                      ? "收藏"
                      : tab === "行李清單"
                        ? "物品"
                        : "支出"}
                </span>
              </button>
            </div>
            {tab === "行程" && (
              <div className="days">
                {dates.map((date, i) => {
                  const entries = data.entries.filter((e) => e.date === date);
                  const expanded = open.includes(date);
                  return (
                    <article className="day" key={date}>
                      <button
                        className="day-toggle"
                        aria-expanded={expanded}
                        onClick={() =>
                          setOpen(
                            expanded
                              ? open.filter((x) => x !== date)
                              : [...open, date],
                          )
                        }
                      >
                        <span className="day-number">
                          {String(i + 1).padStart(2, "0")}
                          <small>DAY</small>
                        </span>
                        <span className="day-title">
                          <span className="day-date">
                            11.{23 + i}{" "}
                            <small>
                              {["MON", "TUE", "WED", "THU", "FRI"][i]}
                            </small>
                          </span>
                          <strong>{labels[i]}</strong>
                          <span className="day-preview">
                            {entries.map((e) => e.name).join(" · ") ||
                              "留白的一天，新增一點期待"}
                          </span>
                        </span>
                        <span className="day-count">
                          {entries.length} 個行程
                        </span>
                        <ChevronDown
                          size={19}
                          className={expanded ? "rotate" : ""}
                        />
                      </button>
                      {expanded && (
                        <div className="timeline">
                          {entries.map((e, index) => (
                            <div className="event" key={e.id}>
                              <div className="event-time">
                                {e.time || "自由安排"}
                                <span />
                              </div>
                              <div className="event-card">
                                <div className="event-head">
                                  <h3>{e.name}</h3>
                                  <div className="actions">
                                    <button
                                      className="icon"
                                      disabled={index === 0}
                                      aria-label={`上移 ${e.name}`}
                                      onClick={() => move(e.id, -1)}
                                    >
                                      <ArrowUp size={15} />
                                    </button>
                                    <button
                                      className="icon"
                                      disabled={index === entries.length - 1}
                                      aria-label={`下移 ${e.name}`}
                                      onClick={() => move(e.id, 1)}
                                    >
                                      <ArrowDown size={15} />
                                    </button>
                                    <button
                                      className="icon"
                                      aria-label={`編輯 ${e.name}`}
                                      onClick={() => editLive("entry", e)}
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      className="icon danger"
                                      aria-label={`刪除 ${e.name}`}
                                      onClick={() => remove("entry", e.id)}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                                {e.address && (
                                  <p className="address">
                                    <MapPin size={14} />
                                    {e.address}
                                  </p>
                                )}
                                <p className="notes">{e.notes}</p>
                                {e.notes.includes("https://tyo-nrt.com") && (
                                  <a
                                    className="text-link"
                                    href="https://tyo-nrt.com/wp/wp-content/themes/tyo-nrt/files/timetable_new_horizon.pdf"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    機場巴士時刻表 ↗
                                  </a>
                                )}
                                {e.privateInfo && (
                                  <p className="private">
                                    私人預約資訊已儲存於本機，可於編輯查看
                                  </p>
                                )}
                                <Maps
                                  name={e.name}
                                  address={e.address}
                                  url={e.url}
                                />
                                <Photos photos={e.photos} />
                              </div>
                            </div>
                          ))}
                          <button
                            className="add-dashed"
                            onClick={() => add("entry", date)}
                          >
                            <Plus size={16} />
                            為這一天新增行程
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            {tab === "口袋名單" && (
              <>
                <div className="toolbar">
                  <label className="search">
                    搜尋收藏
                    <input
                      placeholder="名稱、區域或備註"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <label>
                    分類
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      {["全部", ...placeCategories].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="maps-custom">
                  <Heart size={19} />
                  <span>
                    我的 Google Maps 收藏
                    <small>自行設定入口，收藏不會自動同步。</small>
                  </span>
                  {safeUrl(data.mapsUrl) ? (
                    <a
                      className="text-link"
                      href={safeUrl(data.mapsUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      開啟收藏 ↗
                    </a>
                  ) : (
                    <button onClick={() => setSettings(true)}>設定連結</button>
                  )}
                </div>
                <div className="place-grid">
                  {data.places
                    .filter(
                      (p) =>
                        (filter === "全部" || p.category === filter) &&
                        `${p.name} ${p.area} ${p.notes}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    )
                    .map((p) => (
                      <article className="place-card" key={p.id}>
                        <div className="event-head">
                          <span className="tag">
                            {p.category} {p.area && `· ${p.area}`}
                          </span>
                          <div className="actions">
                            <button
                              className="icon"
                              aria-label={`編輯 ${p.name}`}
                              onClick={() => editLive("place", p)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon danger"
                              aria-label={`刪除 ${p.name}`}
                              onClick={() => remove("place", p.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <h3>{p.name}</h3>
                        <p className="notes">{p.notes}</p>
                        <Photos photos={p.photos} />
                        <Maps name={p.name} address={p.area} url={p.url} />
                      </article>
                    ))}
                </div>
                {!data.places.length && (
                  <div className="empty">
                    <Heart size={30} />
                    <h3>下一個心動的地方</h3>
                    <p>從一間咖啡廳、一家餐廳，開始你的口袋名單。</p>
                    <button onClick={() => add("place")}>
                      ＋ 新增第一個收藏
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "行李清單" && (
              <>
                <div className="packing-progress">
                  <div>
                    <strong>準備好了 {progress}%</strong>
                    <span>
                      {completed} / {data.packing.length} 項
                    </span>
                  </div>
                  <progress max="100" value={progress} />
                  <small>
                    依個人需要調整數量，出發前也別忘了確認天氣預報。
                  </small>
                </div>
                <div className="packing-grid">
                  {[
                    ...new Set([
                      ...packCategories,
                      ...data.packing.map((p) => p.category),
                    ]),
                  ].map((c) => (
                    <article className="packing-card" key={c}>
                      <h3>
                        {c}
                        <span>
                          {
                            data.packing.filter(
                              (p) => p.category === c && p.done,
                            ).length
                          }
                          /{data.packing.filter((p) => p.category === c).length}
                        </span>
                      </h3>
                      {data.packing
                        .filter((p) => p.category === c)
                        .map((p) => (
                          <div className="pack-row" key={p.id}>
                            <label>
                              <input
                                type="checkbox"
                                checked={p.done}
                                onChange={() =>
                                  update((d) => ({
                                    ...d,
                                    packing: d.packing.map((x) =>
                                      x.id === p.id
                                        ? { ...x, done: !x.done }
                                        : x,
                                    ),
                                  }))
                                }
                              />
                              <span className={p.done ? "checked" : ""}>
                                {p.name}
                              </span>
                            </label>
                            <button
                              className="icon"
                              aria-label={`編輯 ${p.name}`}
                              onClick={() => editLive("packing", p)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon danger"
                              aria-label={`刪除 ${p.name}`}
                              onClick={() => remove("packing", p.id)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                    </article>
                  ))}
                </div>
              </>
            )}
            {tab === "記帳" && (
              <>
                <div className="budget">
                  <div>
                    <p>旅行已記錄總支出</p>
                    <strong>
                      <small>NT$</small> {money(total)}
                    </strong>
                    <span>已知費用先行記錄，未填金額不計入。</span>
                  </div>
                  <label>
                    參考匯率 · 1 JPY = TWD
                    <input
                      aria-label="參考匯率"
                      type="number"
                      min="0.000001"
                      step="0.001"
                      value={data.rate}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (n > 0 && Number.isFinite(n))
                          update((d) => ({ ...d, rate: n }));
                      }}
                    />
                    <small>初始 0.22 僅為示例，請依實際匯率調整。</small>
                  </label>
                </div>
                <div className="category-totals">
                  {[
                    ...new Set([
                      ...expenseCategories,
                      ...data.expenses.map((e) => e.category),
                    ]),
                  ].map((c) => (
                    <div key={c}>
                      <span>{c}</span>
                      <strong>
                        NT${" "}
                        {money(
                          data.expenses
                            .filter((e) => e.category === c)
                            .reduce((s, e) => s + twd(e, data.rate), 0),
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
                <h3 className="subheading">每日支出</h3>
                {[...new Set([...dates, ...data.expenses.map((e) => e.date)])]
                  .sort()
                  .map((date) => (
                    <article className="expense-day" key={date}>
                      <div className="expense-date">
                        <strong>{date}</strong>
                        <span>
                          NT${" "}
                          {money(
                            data.expenses
                              .filter((e) => e.date === date)
                              .reduce((s, e) => s + twd(e, data.rate), 0),
                          )}
                        </span>
                      </div>
                      {data.expenses
                        .filter((e) => e.date === date)
                        .map((e) => (
                          <div className="expense-row" key={e.id}>
                            <span className="tag">{e.category}</span>
                            <div>
                              <strong>{e.name}</strong>
                              {e.notes && <p>{e.notes}</p>}
                            </div>
                            <span className="amount">
                              {e.currency} {money(e.amount)}
                            </span>
                            <div className="actions">
                              <button
                                className="icon"
                                aria-label={`編輯 ${e.name}`}
                                onClick={() => editLive("expense", e)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="icon danger"
                                aria-label={`刪除 ${e.name}`}
                                onClick={() => remove("expense", e.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      {!data.expenses.some((e) => e.date === date) && (
                        <p className="muted">還沒有記錄支出</p>
                      )}
                    </article>
                  ))}
              </>
            )}
          </section>
        )}
        <footer>
          <Mountain size={19} />
          <p>Collect moments, keep them close.</p>
          <span>
            資料只儲存在目前瀏覽器，換裝置不會自動同步。請定期匯出備份。
          </span>
          <button
            className="text-link"
            disabled={!ready}
            onClick={() => setSettings(true)}
          >
            資料備份與設定 ↗
          </button>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="主要導覽">
        {(
          [
            { name: "行程", Icon: MapPin },
            { name: "口袋名單", Icon: Heart },
            { name: "行李清單", Icon: Luggage },
            { name: "記帳", Icon: Wallet },
          ] as const
        ).map(({ name, Icon }) => (
          <button
            key={name}
            aria-current={tab === name ? "page" : undefined}
            className={tab === name ? "active" : ""}
            onClick={() => {
              setTab(name);
              setFilter("全部");
              setQuery("");
            }}
          >
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      <dialog
        ref={dialogRef}
        onCancel={() => {
          setEditor(undefined);
          setSettings(false);
        }}
        onClose={() => {
          setEditor(undefined);
          setSettings(false);
        }}
      >
        <div className="modal-head">
          <h2>
            {settings
              ? "手帳設定與備份"
              : `編輯${editor?.kind === "entry" ? "行程" : editor?.kind === "place" ? "收藏" : editor?.kind === "packing" ? "物品" : "支出"}`}
          </h2>
          <button
            className="icon"
            aria-label="關閉視窗"
            disabled={busy}
            onClick={() => {
              setEditor(undefined);
              setSettings(false);
            }}
          >
            <X size={21} />
          </button>
        </div>
        {settings && data && (
          <div className="settings">
            <p>
              資料與照片只保存在此瀏覽器的
              IndexedDB，不需登入。清除瀏覽器資料會移除手帳，換裝置請使用備份轉移。
            </p>
            <label>
              我的 Google Maps 收藏網址
              <input
                type="url"
                placeholder="https://www.google.com/maps/..."
                value={data.mapsUrl}
                onChange={(e) =>
                  update((d) => ({ ...d, mapsUrl: e.target.value }))
                }
              />
            </label>
            <p className="muted">
              此連結僅作為入口，網站不會讀取或同步私人收藏。
            </p>
            <div className="backup-buttons">
              <button onClick={() => void exportBackup()}>
                <Download size={17} />
                完整匯出（含照片）
              </button>
              <button onClick={() => fileInput.current?.click()}>
                <Upload size={17} />
                匯入備份
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => void importBackup(e.target.files?.[0])}
            />
            <p className="notice">
              備份包含私人預約資訊及照片，請妥善保存。匯入將取代目前手帳。
            </p>
            <p role="status">{status}</p>
          </div>
        )}
        {editor && (
          <form onSubmit={saveEditor}>
            <p className="form-hint">
              既有項目修改後自動儲存；新增項目請按下「儲存」。
            </p>
            <label>
              名稱
              <input
                autoFocus
                required
                maxLength={200}
                value={editor.value.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            {editor.kind === "entry" && (
              <>
                <div className="form-grid">
                  <label>
                    日期
                    <select
                      value={editor.value.date}
                      onChange={(e) => field("date", e.target.value)}
                    >
                      {dates.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    時間
                    <input
                      type="time"
                      value={editor.value.time}
                      onChange={(e) => field("time", e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  地址
                  <input
                    value={editor.value.address}
                    onChange={(e) => field("address", e.target.value)}
                  />
                </label>
              </>
            )}
            {editor.kind === "place" && (
              <div className="form-grid">
                <label>
                  分類
                  <select
                    value={editor.value.category}
                    onChange={(e) => field("category", e.target.value)}
                  >
                    {placeCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  區域
                  <input
                    value={editor.value.area}
                    onChange={(e) => field("area", e.target.value)}
                  />
                </label>
              </div>
            )}
            {editor.kind === "packing" && (
              <label>
                分類
                <select
                  value={editor.value.category}
                  onChange={(e) => field("category", e.target.value)}
                >
                  {packCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {editor.kind === "expense" && (
              <>
                <div className="form-grid">
                  <label>
                    日期
                    <input
                      type="date"
                      required
                      value={editor.value.date}
                      onChange={(e) => field("date", e.target.value)}
                    />
                  </label>
                  <label>
                    分類
                    <select
                      value={editor.value.category}
                      onChange={(e) => field("category", e.target.value)}
                    >
                      {expenseCategories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    金額
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editor.value.amount}
                      onChange={(e) => field("amount", Number(e.target.value))}
                    />
                  </label>
                  <label>
                    幣別
                    <select
                      value={editor.value.currency}
                      onChange={(e) => field("currency", e.target.value)}
                    >
                      <option>TWD</option>
                      <option>JPY</option>
                    </select>
                  </label>
                </div>
              </>
            )}
            {"notes" in editor.value && (
              <label>
                備註
                <textarea
                  rows={4}
                  value={editor.value.notes}
                  onChange={(e) => field("notes", e.target.value)}
                />
              </label>
            )}
            {"url" in editor.value && (
              <label>
                Google Maps URL
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={editor.value.url}
                  onChange={(e) => field("url", e.target.value)}
                />
              </label>
            )}
            {editor.kind === "entry" && (
              <label>
                私人預約資訊 · 僅存本機
                <textarea
                  rows={2}
                  placeholder="自行輸入訂位代號等資訊，不會提交至 GitHub"
                  value={editor.value.privateInfo}
                  onChange={(e) => field("privateInfo", e.target.value)}
                />
              </label>
            )}
            {"photos" in editor.value && (
              <div className="photo-editor">
                <label className="upload">
                  <Camera size={19} />
                  {busy ? "照片處理中…" : "上傳照片（自動壓縮）"}
                  <input
                    type="file"
                    aria-label="上傳照片"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={busy}
                    onChange={(e) => void upload(e.target.files)}
                  />
                </label>
                <div className="photo-edit-grid">
                  {editor.value.photos.map((p) => (
                    <div key={p.id}>
                      <img src={p.data} alt={p.caption || "旅行照片預覽"} />
                      <label>
                        照片說明
                        <input
                          value={p.caption}
                          onChange={(e) => {
                            if ("photos" in editor.value)
                              field(
                                "photos",
                                editor.value.photos.map((x) =>
                                  x.id === p.id
                                    ? { ...x, caption: e.target.value }
                                    : x,
                                ),
                              );
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          if ("photos" in editor.value)
                            field(
                              "photos",
                              editor.value.photos.filter((x) => x.id !== p.id),
                            );
                        }}
                      >
                        <Trash2 size={14} />
                        刪除照片
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="form-bottom">
              <span>{status}</span>
              <button className="primary" type="submit" disabled={busy}>
                <Check size={17} />
                儲存
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
function Photos({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<Photo>();
  return (
    <>
      {photos.length > 0 && (
        <div className="photos">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              aria-label={`放大照片 ${p.caption}`}
            >
              <img src={p.data} alt={p.caption || "旅行照片"} />
              {p.caption && <small>{p.caption}</small>}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="照片預覽"
          onClick={() => setSelected(undefined)}
        >
          <button
            autoFocus
            className="icon"
            aria-label="關閉照片"
            onClick={() => setSelected(undefined)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelected(undefined);
            }}
          >
            <X />
          </button>
          <img src={selected.data} alt={selected.caption || "旅行照片"} />
          <p>{selected.caption}</p>
        </div>
      )}
    </>
  );
}
function Maps({
  name,
  address,
  url,
}: {
  name: string;
  address: string;
  url: string;
}) {
  const [preview, setPreview] = useState(false);
  const query = address || name;
  const link =
    safeUrl(url) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <div className="maps">
      <div className="map-links">
        <a href={link} target="_blank" rel="noreferrer">
          <MapPin size={14} />
          開啟 Google Maps
          <ExternalLink size={11} />
        </a>
        <a
          href={
            safeUrl(url) ||
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
          }
          target="_blank"
          rel="noreferrer"
        >
          <Navigation size={14} />
          導航{url ? "（地圖內選取路線）" : ""}
        </a>
        {address && (
          <button onClick={() => setPreview(!preview)}>
            {preview ? "收起地圖" : "地圖預覽"}
          </button>
        )}
      </div>
      {preview && address && (
        <>
          <iframe
            title={`${name} 地圖預覽`}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
          />
          <small>若地圖無法載入，請使用上方「開啟 Google Maps」。</small>
        </>
      )}
    </div>
  );
}
