import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  DataObject as JsonIcon,
  TableRows as TableRowsIcon,
  GridOn as XlsxIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  gridFilteredSortedRowIdsSelector,
  gridVisibleColumnFieldsSelector,
  useGridApiContext,
  type DataGridProps,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridSortModel,
  type GridFilterModel,
} from '@mui/x-data-grid';
import { ukUA } from '@mui/x-data-grid/locales';

const GRID_LOCALE_TEXT = ukUA.components.MuiDataGrid.defaultProps.localeText;
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

type StoredGridState = {
  columns?: GridColumnVisibilityModel;
  sort?: GridSortModel;
  filter?: GridFilterModel;
  pageSize?: number;
};

function readState(key: string): StoredGridState {
  try {
    const raw = localStorage.getItem(`admin.grid.${key}`);
    return raw ? (JSON.parse(raw) as StoredGridState) : {};
  } catch {
    return {};
  }
}

function writeState(key: string, patch: StoredGridState) {
  try {
    const prev = readState(key);
    localStorage.setItem(`admin.grid.${key}`, JSON.stringify({ ...prev, ...patch }));
  } catch {
    /* ignore quota / access errors */
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 100) || 'export';
}

/** Готує рядки до експорту: беремо тільки видимі в гріді поля, з урахуванням valueGetter/valueFormatter. */
function buildExportRows(
  apiRef: ReturnType<typeof useGridApiContext>,
  columns: GridColDef[]
): Array<Record<string, unknown>> {
  const visibleFields = gridVisibleColumnFieldsSelector(apiRef).filter(
    (f) => f !== '__check__' && f !== 'actions' && !f.startsWith('__row_')
  );
  const ids = gridFilteredSortedRowIdsSelector(apiRef);
  const header: Record<string, string> = {};
  for (const f of visibleFields) {
    const col = columns.find((c) => c.field === f);
    header[f] = col?.headerName ?? f;
  }
  return ids.map((id) => {
    const row: Record<string, unknown> = {};
    for (const f of visibleFields) {
      const raw = apiRef.current.getCellValue(id, f);
      row[header[f]] = raw ?? '';
    }
    return row;
  });
}

interface ExportMenuProps {
  columns: GridColDef[];
  fileName: string;
}

function ExportMenu({ columns, fileName }: ExportMenuProps) {
  const apiRef = useGridApiContext();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const close = () => setAnchorEl(null);

  const exportCsv = useCallback(() => {
    close();
    apiRef.current.exportDataAsCsv({
      fileName,
      utf8WithBom: true,
      allColumns: false,
    });
  }, [apiRef, fileName]);

  const exportJson = useCallback(() => {
    close();
    const rows = buildExportRows(apiRef, columns);
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    saveAs(blob, `${sanitizeFileName(fileName)}.json`);
  }, [apiRef, columns, fileName]);

  const exportXlsx = useCallback(() => {
    close();
    const rows = buildExportRows(apiRef, columns);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${sanitizeFileName(fileName)}.xlsx`);
  }, [apiRef, columns, fileName]);

  return (
    <>
      <Button
        size="small"
        startIcon={<FileDownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Експорт
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={close}>
        <MenuItem onClick={exportXlsx}>
          <ListItemIcon>
            <XlsxIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>XLSX</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportCsv}>
          <ListItemIcon>
            <TableRowsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportJson}>
          <ListItemIcon>
            <JsonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>JSON</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

interface ToolbarProps {
  columns: GridColDef[];
  fileName: string;
  headerActions?: React.ReactNode;
  onRefresh?: () => void;
}

function AppGridToolbar({ columns, fileName, headerActions, onRefresh }: ToolbarProps) {
  return (
    <GridToolbarContainer sx={{ p: 1, gap: 1, flexWrap: 'wrap' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <ExportMenu columns={columns} fileName={fileName} />
      {onRefresh ? (
        <Tooltip title="Оновити">
          <IconButton size="small" onClick={onRefresh}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      <Box sx={{ flex: 1 }} />
      {headerActions}
      <GridToolbarQuickFilter
        debounceMs={250}
        placeholder="Пошук…"
        sx={{ minWidth: 220 }}
      />
    </GridToolbarContainer>
  );
}

export interface AppDataGridProps<R extends { id?: string | number }>
  extends Omit<
    DataGridProps<R>,
    | 'rows'
    | 'columns'
    | 'slots'
    | 'slotProps'
    | 'initialState'
    | 'onColumnVisibilityModelChange'
    | 'onDensityChange'
    | 'onSortModelChange'
    | 'onFilterModelChange'
  > {
  /** Унікальний ключ сторінки для збереження стану в localStorage. */
  storageKey: string;
  rows: readonly R[];
  columns: GridColDef<R>[];
  title?: string;
  subtitle?: string;
  onCreate?: () => void;
  createLabel?: string;
  exportFileName?: string;
  headerActions?: React.ReactNode;
  onRefresh?: () => void;
  /** Висота контейнера таблиці (за замовчуванням '75vh'). */
  height?: number | string;
}

export function AppDataGrid<R extends { id?: string | number }>({
  storageKey,
  rows,
  columns,
  title,
  subtitle,
  onCreate,
  createLabel = 'Додати',
  exportFileName,
  headerActions,
  onRefresh,
  height = '75vh',
  ...rest
}: AppDataGridProps<R>) {
  const stored = useRef<StoredGridState>(readState(storageKey));
  const initial = stored.current;

  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>(
    initial.columns ?? {}
  );
  const [sortModel, setSortModel] = useState<GridSortModel>(initial.sort ?? []);
  const [filterModel, setFilterModel] = useState<GridFilterModel>(
    initial.filter ?? { items: [] }
  );
  const [pageSize, setPageSize] = useState<number>(initial.pageSize ?? 25);

  useEffect(() => {
    writeState(storageKey, { columns: columnVisibility });
  }, [columnVisibility, storageKey]);
  useEffect(() => {
    writeState(storageKey, { sort: sortModel });
  }, [sortModel, storageKey]);
  useEffect(() => {
    writeState(storageKey, { filter: filterModel });
  }, [filterModel, storageKey]);
  useEffect(() => {
    writeState(storageKey, { pageSize });
  }, [pageSize, storageKey]);

  const fileName = useMemo(
    () => sanitizeFileName(exportFileName ?? title ?? storageKey),
    [exportFileName, title, storageKey]
  );

  const renderToolbar = useCallback(
    () => (
      <AppGridToolbar
        columns={columns as GridColDef[]}
        fileName={fileName}
        headerActions={headerActions}
        onRefresh={onRefresh}
      />
    ),
    [columns, fileName, headerActions, onRefresh]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {(title || onCreate) && (
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} gap={2}>
          <Box>
            {title && (
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {onCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
              {createLabel}
            </Button>
          )}
        </Box>
      )}

      <Paper sx={{ height, width: '100%', p: 1 }}>
        <DataGrid<R>
          rows={rows as R[]}
          columns={columns}
          localeText={GRID_LOCALE_TEXT}
          slots={{ toolbar: renderToolbar }}
          slotProps={{
            toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 250 } },
          }}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={setColumnVisibility}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize } },
          }}
          onPaginationModelChange={(m) => setPageSize(m.pageSize)}
          disableRowSelectionOnClick
          {...rest}
        />
      </Paper>
    </Box>
  );
}
