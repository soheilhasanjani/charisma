import { useEffect, useRef } from "react";
import {
  useTable,
  type ColumnDef,
  type ReactTable,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import {
  useVirtualizer,
  type VirtualItem,
  type Virtualizer,
} from "@tanstack/react-virtual";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/table";
import {
  dataTableFeatures,
  type DataTableFeatures,
} from "@/components/patterns/data-table-features";

const DATA_TABLE_ROW_HEIGHT = 33;

const canMeasureRowHeight =
  typeof navigator !== "undefined" &&
  navigator.userAgent.indexOf("Firefox") === -1;

function estimateDataTableRowSize() {
  return DATA_TABLE_ROW_HEIGHT;
}

function measureTableRow(element: Element) {
  return element.getBoundingClientRect().height;
}

type DataTableVirtualizedProps<TData extends RowData> = {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
};

export function DataTableVirtualized<TData extends RowData>({
  columns,
  data,
}: DataTableVirtualizedProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex h-[min(50rem,70dvh)] flex-col overflow-hidden rounded-lg border">
      <div className="h-10 shrink-0 border-b bg-background">
        <table className="grid h-full w-full caption-bottom text-sm">
          <TableHeader className="grid h-full [&_tr]:border-b-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="flex h-10 w-full border-b-0 bg-background hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="flex h-10 flex-1 items-center"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </table>
      </div>
      {rows.length ? (
        <DataTableVirtualizedBody table={table} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="grid w-full text-sm">
            <TableBody>
              <TableRow className="flex w-full">
                <TableCell className="flex h-24 flex-1 items-center justify-center">
                  نتیجه‌ای یافت نشد.
                </TableCell>
              </TableRow>
            </TableBody>
          </table>
        </div>
      )}
    </div>
  );
}

type DataTableVirtualizedBodyProps<TData extends RowData> = {
  table: ReactTable<DataTableFeatures, TData>;
};

function DataTableVirtualizedBody<TData extends RowData>({
  table,
}: DataTableVirtualizedBodyProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  // Keep the virtualizer in the lowest component to avoid unnecessary re-renders.
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual cannot be memoized by React Compiler
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: estimateDataTableRowSize,
    getItemKey: (index) => rows[index]?.id ?? index,
    getScrollElement: () => tableContainerRef.current,
    measureElement: canMeasureRowHeight ? measureTableRow : undefined,
    overscan: 5,
  });

  useEffect(() => {
    rowVirtualizer.measure();
    // Initial measure after mount; the virtualizer instance is stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={tableContainerRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
    >
      <table
        aria-rowcount={rows.length + 1}
        className="grid w-full caption-bottom text-sm"
      >
        <TableBody
          className="relative grid"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];

            if (!row) {
              return null;
            }

            return (
              <DataTableVirtualizedRow
                key={row.id}
                row={row}
                rowVirtualizer={rowVirtualizer}
                table={table}
                virtualRow={virtualRow}
              />
            );
          })}
        </TableBody>
      </table>
    </div>
  );
}

type DataTableVirtualizedRowProps<TData extends RowData> = {
  row: Row<DataTableFeatures, TData>;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  table: ReactTable<DataTableFeatures, TData>;
  virtualRow: VirtualItem;
};

function DataTableVirtualizedRow<TData extends RowData>({
  row,
  rowVirtualizer,
  table,
  virtualRow,
}: DataTableVirtualizedRowProps<TData>) {
  return (
    <TableRow
      data-index={virtualRow.index}
      ref={(node) => {
        rowVirtualizer.measureElement(node);
      }}
      className="absolute flex w-full"
      style={{
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {row.getAllCells().map((cell) => (
        <TableCell key={cell.id} className="flex flex-1 items-center">
          <table.FlexRender cell={cell} />
        </TableCell>
      ))}
    </TableRow>
  );
}
