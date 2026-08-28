import { formatDate } from "@/lib/format-date";

const EMPTY_DISPLAY = "-";

const optionTypeByCode = {
  C: "call",
  P: "put",
} as const;

type OptionType = (typeof optionTypeByCode)[keyof typeof optionTypeByCode];

export type ParsedOptionSymbol = {
  ticker: string;
  expiry: string;
  strike: number;
  type: OptionType;
};

const strikeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const optionTypeLabel: Record<OptionType, string> = {
  call: "Call",
  put: "Put",
};

const optionTypeClassName: Record<OptionType, string> = {
  call: "text-green-600 dark:text-green-400",
  put: "text-red-600 dark:text-red-400",
};

export function parseOptionSymbol(symbol: string): ParsedOptionSymbol | null {
  const parts = symbol.split("_");

  if (parts.length < 4) {
    return null;
  }

  const typeCode = parts.at(-1)?.toUpperCase();
  const strikeRaw = parts.at(-2);
  const expiry = parts.at(-3);
  const ticker = parts.slice(0, -3).join("_");

  if (
    !ticker ||
    !expiry ||
    !strikeRaw ||
    (typeCode !== "C" && typeCode !== "P")
  ) {
    return null;
  }

  if (!/^\d{8}$/.test(expiry) || !/^\d+(?:\.\d+)?$/.test(strikeRaw)) {
    return null;
  }

  const year = Number(expiry.slice(0, 4));
  const month = Number(expiry.slice(4, 6));
  const day = Number(expiry.slice(6, 8));
  const expiryDate = new Date(year, month - 1, day);

  if (
    expiryDate.getFullYear() !== year ||
    expiryDate.getMonth() !== month - 1 ||
    expiryDate.getDate() !== day
  ) {
    return null;
  }

  return {
    ticker,
    expiry,
    strike: Number(strikeRaw),
    type: optionTypeByCode[typeCode],
  };
}

export function formatOptionTicker(symbol: string) {
  const parsed = parseOptionSymbol(symbol);

  return (
    <span dir="ltr" lang="en" className="font-medium" title={symbol}>
      {parsed?.ticker ?? symbol}
    </span>
  );
}

export function formatOptionStrike(symbol: string) {
  const parsed = parseOptionSymbol(symbol);

  if (!parsed) {
    return EMPTY_DISPLAY;
  }

  return (
    <span dir="ltr" lang="en" className="tabular-nums">
      {strikeFormatter.format(parsed.strike)}
    </span>
  );
}

export function formatOptionType(symbol: string) {
  const parsed = parseOptionSymbol(symbol);

  if (!parsed) {
    return EMPTY_DISPLAY;
  }

  return (
    <span dir="ltr" lang="en" className={optionTypeClassName[parsed.type]}>
      {optionTypeLabel[parsed.type]}
    </span>
  );
}

export function formatOptionExpiry(symbol: string) {
  const parsed = parseOptionSymbol(symbol);

  if (!parsed) {
    return EMPTY_DISPLAY;
  }

  return formatDate(parsed.expiry, "fa-IR");
}
