export const dates = [
  "2026-11-23",
  "2026-11-24",
  "2026-11-25",
  "2026-11-26",
  "2026-11-27",
];
export const expenseCategories = [
  "住宿",
  "交通",
  "餐飲",
  "購物",
  "門票",
  "其他",
];
export const packCategories = [
  "證件",
  "衣物",
  "保暖用品",
  "盥洗保養",
  "電子用品",
  "藥品",
  "其他",
];
export const placeCategories = ["餐廳", "咖啡廳", "購物", "景點", "其他"];
export type Photo = { id: string; data: string; caption: string };
export type Entry = {
  id: string;
  date: string;
  time: string;
  name: string;
  address: string;
  notes: string;
  url: string;
  privateInfo: string;
  photos: Photo[];
};
export type Place = {
  id: string;
  name: string;
  category: string;
  area: string;
  url: string;
  notes: string;
  photos: Photo[];
};
export type Packing = {
  id: string;
  name: string;
  category: string;
  done: boolean;
};
export type Expense = {
  id: string;
  date: string;
  name: string;
  category: string;
  amount: number;
  currency: "TWD" | "JPY";
  notes: string;
};
export type Journal = {
  version: 1;
  entries: Entry[];
  places: Place[];
  packing: Packing[];
  expenses: Expense[];
  rate: number;
  mapsUrl: string;
};
export const uid = () => crypto.randomUUID();
const entry = (
  date: string,
  time: string,
  name: string,
  notes = "",
  address = "",
  url = "",
): Entry => ({
  id: uid(),
  date,
  time,
  name,
  notes,
  address,
  url,
  privateInfo: "",
  photos: [],
});
export function initialJournal(): Journal {
  const entries = [
    entry(
      dates[0],
      "10:10",
      "JX802 · 出發去東京",
      "桃園機場第一航廈 10:10 出發 → 成田機場第二航廈 14:20 抵達",
    ),
    entry(
      dates[0],
      "14:20",
      "TYO-NRT 機場巴士 → 東京站",
      "抵達後搭機場巴士至東京站日本橋口，再搭計程車前往飯店。時刻表：https://tyo-nrt.com/wp/wp-content/themes/tyo-nrt/files/timetable_new_horizon.pdf",
    ),
    entry(
      dates[0],
      "15:00",
      "相鉄グランドフレッサ 高田馬場",
      "入住 11/23 15:00；退房 11/24 10:00。住宿 TWD 2816。",
      "東京都新宿区高田馬場1丁目27-7",
    ),
    entry(
      dates[0],
      "19:30",
      "晚餐預約 · 餐廳名稱待確認",
      "兩位預約，餐廳名稱尚未確認。",
      "",
      "https://maps.app.goo.gl/1LeTYRPejidaKVKd8",
    ),
    entry(
      dates[1],
      "06:40",
      "高田馬場 → 新宿巴士乘車處",
      "前往新宿巴士乘車處。",
    ),
    entry(
      dates[1],
      "07:25",
      "新宿 → 富士山山中湖",
      "預計 07:25–09:10，富士山飯店入口下車；時間與站點待確認。",
    ),
    entry(
      dates[1],
      "09:30",
      "租車 · 開始富士山小旅行",
      "租車 11/24 09:30–11/25 13:30；費用 TWD 3273。",
      "",
      "https://maps.app.goo.gl/cpNeJ3EuzBLA5XZ48?g_st=ic",
    ),
    entry(
      dates[1],
      "15:00",
      "初聚 SHOSHU hotel",
      "入住 11/24 15:00；退房 11/25 10:00。含早餐與 Wi-Fi，住宿費用待填。",
      "山梨縣山中湖村山中865-182",
    ),
    entry(dates[2], "", "富士山／河口湖周邊遊玩", "留一點時間，慢慢看富士山。"),
    entry(
      dates[2],
      "13:30",
      "還車 → 返回東京",
      "13:30 還車；返回東京的交通尚未確認。",
      "",
      "https://maps.app.goo.gl/cpNeJ3EuzBLA5XZ48?g_st=ic",
    ),
    entry(
      dates[2],
      "15:00",
      "Andy Garden Inn · 201 室",
      "入住 11/25 15:00；退房 11/27 10:00，可寄放行李。兩晚房費 TWD 6950.25，服務費 TWD 1196，已提供總價 TWD 8147。原始分項合計 8146.25，與總價差 0.75，保留原始數字；記帳以提供總價計入一次。",
      "東京都新宿区大久保1-4-5",
    ),
    entry(
      dates[3],
      "",
      "東京迪士尼一日遊",
      "已記錄費用 TWD 4413，項目細節待確認。今晚住宿 Andy Garden Inn。",
    ),
    entry(
      dates[4],
      "10:00",
      "退房 → 成田機場第二航廈",
      "Andy Garden Inn 10:00 退房；前往機場的交通待確認。",
    ),
    entry(
      dates[4],
      "13:45",
      "JX801 · 帶著回憶回家",
      "成田機場第二航廈 13:45 起飛 → 桃園機場第一航廈 16:50 抵達。",
    ),
  ];
  const packs: Record<string, string[]> = {
    證件: [
      "護照（確認效期）",
      "機票與住宿確認資料",
      "駕照正本與日文譯本",
      "信用卡、日圓現金、旅遊保險",
    ],
    衣物: ["五天換洗衣物與內衣襪", "長褲與可分層長袖", "舒適好走的鞋", "睡衣"],
    保暖用品: [
      "保暖外套／羽絨外套",
      "發熱衣、保暖內搭",
      "圍巾、毛帽、手套",
      "暖暖包（依航空規定攜帶）",
    ],
    盥洗保養: [
      "牙刷、牙膏與旅行盥洗組",
      "保濕乳、護唇膏",
      "防曬與個人保養用品",
    ],
    電子用品: [
      "手機與充電線",
      "行動電源（隨身攜帶）",
      "充電器與插頭確認",
      "eSIM／網路方案、相機",
    ],
    藥品: ["個人常備藥與處方", "腸胃藥、暈車藥", "OK 繃與口罩"],
    其他: ["摺疊傘", "水瓶與環保袋", "行李鎖與行李牌"],
  };
  return {
    version: 1,
    entries,
    places: [],
    packing: Object.entries(packs).flatMap(([category, names]) =>
      names.map((name) => ({ id: uid(), name, category, done: false })),
    ),
    expenses: [
      ["相鉄グランドフレッサ 高田馬場", 2816, "住宿", dates[0], ""],
      ["租車", 3273, "交通", dates[1], ""],
      [
        "Andy Garden Inn · 兩晚總價",
        8147,
        "住宿",
        dates[2],
        "房費 6950.25 + 服務費 1196；提供總價 8147，差額 0.75，保留原始金額，避免重複計入。",
      ],
      [
        "迪士尼費用",
        4413,
        "門票",
        dates[3],
        "費用項目細節待確認，分類可再調整。",
      ],
    ].map(([name, amount, category, date, notes]) => ({
      id: uid(),
      name: String(name),
      amount: Number(amount),
      category: String(category),
      date: String(date),
      notes: String(notes),
      currency: "TWD",
    })),
    rate: 0.22,
    mapsUrl: "",
  };
}
export function safeUrl(value: string): string {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
export function twd(expense: Expense, rate: number) {
  return expense.amount * (expense.currency === "JPY" ? rate : 1);
}
