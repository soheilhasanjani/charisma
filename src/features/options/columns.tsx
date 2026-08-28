import { createColumnHelper } from "@tanstack/react-table";

import type { DataTableFeatures } from "@/components/patterns/data-table-features";
import {
  formatOptionExpiry,
  formatOptionStrike,
  formatOptionTicker,
  formatOptionType,
} from "@/features/options/lib/format-option-symbol";
import { formatPrice } from "@/lib/format-price";
import type { OptionSnapshot } from "@/features/options/types";

const columnHelper = createColumnHelper<DataTableFeatures, OptionSnapshot>();

export const optionsColumns = columnHelper.columns([
  columnHelper.accessor("symbol", {
    id: "ticker",
    header: "نماد",
    cell: ({ getValue }) => formatOptionTicker(getValue()),
  }),
  columnHelper.accessor("symbol", {
    id: "strike",
    header: "قیمت اعمال",
    cell: ({ getValue }) => formatOptionStrike(getValue()),
  }),
  columnHelper.accessor("symbol", {
    id: "optionType",
    header: "نوع",
    cell: ({ getValue }) => formatOptionType(getValue()),
  }),
  columnHelper.accessor("symbol", {
    id: "expiry",
    header: "سررسید",
    cell: ({ getValue }) => formatOptionExpiry(getValue()),
  }),
  columnHelper.accessor("last", {
    header: "آخرین قیمت",
    cell: ({ getValue }) => formatPrice(getValue()),
  }),
  columnHelper.accessor("bid", {
    header: "قیمت عرضه",
    cell: ({ getValue }) => formatPrice(getValue()),
  }),
  columnHelper.accessor("ask", {
    header: "قیمت تقاضا",
    cell: ({ getValue }) => formatPrice(getValue()),
  }),
]);
