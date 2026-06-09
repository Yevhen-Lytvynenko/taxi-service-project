import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  GpsFixed as GpsIcon,
} from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';

/** Колонка-іконка «стежити на карті» → навігує на /live/driver/:driverId. */
export function buildGpsColumn<R extends Record<string, unknown>>(
  getDriverId: (row: R) => string | null | undefined,
  navigate: (path: string) => void,
  opts?: { field?: string; headerName?: string; width?: number }
): GridColDef<R> {
  return {
    field: opts?.field ?? 'gps',
    headerName: opts?.headerName ?? 'GPS',
    width: opts?.width ?? 70,
    sortable: false,
    filterable: false,
    disableExport: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      const id = getDriverId(params.row as R);
      if (!id) return null;
      return (
        <Tooltip title="Стежити на мапі">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/live/driver/${id}`);
            }}
          >
            <GpsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    },
  };
}

/** Колонка-іконка «переписка поїздки» → викликає переданий `onOpen(orderId)`. */
export function buildChatColumn<R extends Record<string, unknown>>(
  getOrderId: (row: R) => string | null | undefined,
  onOpen: (orderId: string) => void,
  opts?: { field?: string; headerName?: string; width?: number }
): GridColDef<R> {
  return {
    field: opts?.field ?? 'chat',
    headerName: opts?.headerName ?? 'Чат',
    width: opts?.width ?? 70,
    sortable: false,
    filterable: false,
    disableExport: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      const id = getOrderId(params.row as R);
      if (!id) return null;
      return (
        <Tooltip title="Переглянути чат поїздки">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(id);
            }}
          >
            <ChatIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    },
  };
}

/** Стандартні кнопки Edit/Delete у окремій колонці. */
export function buildRowActionsColumn<R extends { id?: string | number }>(params: {
  onEdit?: (row: R) => void;
  onDelete?: (id: string) => void;
  field?: string;
  headerName?: string;
  width?: number;
}): GridColDef<R> {
  const width =
    params.width ??
    (params.onEdit && params.onDelete ? 110 : params.onEdit || params.onDelete ? 70 : 70);
  return {
    field: params.field ?? 'actions',
    headerName: params.headerName ?? 'Дії',
    width,
    sortable: false,
    filterable: false,
    disableExport: true,
    align: 'right',
    headerAlign: 'right',
    renderCell: (p) => (
      <Box>
        {params.onEdit && (
          <Tooltip title="Редагувати">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                params.onEdit?.(p.row as R);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {params.onDelete && (
          <Tooltip title="Видалити">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                params.onDelete?.(String(p.id));
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    ),
  };
}
