const fa = {
  app: {
    brand: 'بازار آپشن',
    title: 'بازار آپشن',
  },
  common: {
    retry: 'تلاش مجدد',
    clear: 'پاک کردن',
    empty: '—',
    close: 'بستن',
  },
  theme: {
    toggle: 'تغییر پوسته',
    light: 'روشن',
    dark: 'تیره',
    system: 'سیستم',
  },
  locale: {
    switch: 'تغییر زبان',
    fa: 'فارسی',
    en: 'English',
  },
  columns: {
    ticker: {
      header: 'نماد',
      description: 'نماد پایه قرارداد آپشن.',
    },
    strike: {
      header: 'قیمت اعمال',
      description: 'قیمت اعمال قرارداد آپشن.',
    },
    type: {
      header: 'نوع',
      description: 'Call یا Put.',
    },
    expiry: {
      header: 'سررسید',
      description: 'تاریخ سررسید قرارداد.',
    },
    last: {
      header: 'آخرین قیمت',
      description: 'آخرین قیمت معامله‌شده.',
    },
    bid: {
      header: 'قیمت عرضه',
      description: 'بهترین قیمت خرید در دفتر سفارش.',
    },
    ask: {
      header: 'قیمت تقاضا',
      description: 'بهترین قیمت فروش در دفتر سفارش.',
    },
    spread: {
      header: 'اسپرد',
      description: 'اختلاف قیمت تقاضا و عرضه (ask − bid).',
    },
    lastTradeSide: {
      header: 'سمت معامله',
      description: 'سمت آخرین معامله ثبت‌شده برای نماد.',
    },
    riskScore: {
      header: 'امتیاز ریسک',
      description:
        'امتیاز ریسک ترکیبی از سه جزء: Greeks (δ، γ، θ، ν)، اسپرد (ask−bid)/last، و Omega AI (حلقه ۵۰۰-تایی sin/cos روی last و bid).',
    },
    help: 'راهنمای ستون {{column}}',
  },
  feed: {
    offline: 'آفلاین',
    watchdog: 'اتصال بی‌صدا — در حال اتصال مجدد',
    manualRetry: 'اتصال ناموفق — تلاش مجدد',
    connecting: 'در حال اتصال…',
    slow: 'اتصال کند',
    serverDisconnected: 'سرور disconnected گزارش کرد',
    connected: 'متصل',
    disconnected: 'قطع',
  },
  grid: {
    emptySnapshot: 'داده‌ای از سرور دریافت نشد.',
    emptySnapshotHint: 'اتصال شبکه یا پاسخ API را بررسی کنید.',
    emptyFilter: 'هیچ نمادی با فیلتر فعلی مطابقت ندارد.',
    emptyFilterHint: 'فیلتر را پاک کنید یا معیار دیگری انتخاب کنید.',
  },
  filter: {
    placeholder: 'فیلتر نماد',
    selectedCount: '{{count}} نماد انتخاب شده',
    searchPlaceholder: 'جستجوی نماد یا تیکر…',
    noResults: 'نمادی یافت نشد.',
    selectGroup: 'انتخاب گروه',
    deselectGroup: 'حذف گروه',
    removeSymbol: 'حذف {{symbol}}',
  },
  trade: {
    latest: 'آخرین معامله:',
    none: 'هنوز معامله‌ای ثبت نشده',
    pause: 'توقف نمایش معاملات',
    resume: 'ادامه نمایش معاملات',
    sideBuy: 'خرید',
    sideSell: 'فروش',
    sideBuyLabel: 'Buy',
    sideSellLabel: 'Sell',
    liveAnnouncement: 'معامله {{side}} {{symbol}} به قیمت {{price}}',
  },
  optionType: {
    call: 'Call',
    put: 'Put',
  },
  detail: {
    description: 'جزئیات زنده نماد انتخاب‌شده',
    greeks: 'Greeks',
    riskScore: 'امتیاز ریسک',
    priceChart: 'نمودار قیمت',
    recentTrades: 'معاملات اخیر',
    noTrades: 'هنوز معامله‌ای برای این نماد ثبت نشده.',
    insufficientData: 'داده کافی نیست.',
    chartLabel: 'نمودار قیمت اخیر',
    greeksComponent: 'Greeks component',
    spreadComponent: 'Spread component',
    omegaAI: 'Omega AI',
    total: 'Total',
    delta: 'Delta',
    gamma: 'Gamma',
    theta: 'Theta',
    vega: 'Vega',
  },
  errors: {
    timeout: 'زمان پاسخ سرور به پایان رسید. دوباره تلاش کنید.',
    network: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.',
    rateLimit: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
    server: 'خطای سرور رخ داد. دوباره تلاش کنید.',
    generic: 'بارگذاری اطلاعات ناموفق بود. دوباره تلاش کنید.',
    boundary: 'خطایی در بارگذاری برنامه رخ داد.',
    boundaryHint: 'صفحه را دوباره بارگذاری کنید.',
  },
} as const

export default fa

type DeepString<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepString<U>[]
    : T extends object
      ? { [K in keyof T]: DeepString<T[K]> }
      : T

export type FaTranslation = DeepString<typeof fa>
