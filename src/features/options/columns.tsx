import { createColumnHelper } from "@tanstack/react-table";

import type { DataTableFeatures } from "@/components/patterns/data-table-features";
import type { OptionSnapshot } from "@/features/options/types";
import { formatPrice } from "@/lib/format-price";

const columnHelper = createColumnHelper<DataTableFeatures, OptionSnapshot>();

export const optionsColumns = columnHelper.columns([
  columnHelper.accessor("symbol", {
    header: "نماد",
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
