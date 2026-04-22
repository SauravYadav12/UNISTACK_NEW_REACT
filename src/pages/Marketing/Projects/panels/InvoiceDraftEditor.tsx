import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { tokens } from '../../../../theme/theme';
import { IInvoiceLineItem } from '../../../../Interfaces/invoice';
import { formatMoney } from '../../../../utils/money';

interface DraftEditorState {
  lineItems: IInvoiceLineItem[];
  taxPercent: number;
  taxLabel?: string;
  notes?: string;
  /** Admin / super-admin only — freeform override of the auto-generated
   *  invoice number. Leave undefined to keep the server's current value. */
  invoiceNumber?: string;
  /** Admin / super-admin only — issue date as YYYY-MM-DD. */
  issueDate?: string;
}

interface Props {
  value: DraftEditorState;
  currency: string;
  /** When true, renders the Invoice # + Issue date inputs. Only admin
   *  and super-admin get this privilege. */
  canEditMeta?: boolean;
  onChange: (next: DraftEditorState) => void;
}

function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export default function InvoiceDraftEditor({
  value,
  currency,
  canEditMeta,
  onChange,
}: Props) {
  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = roundMoney(
      value.lineItems.reduce(
        (acc, li) => acc + (Number.isFinite(li.amount) ? li.amount : 0),
        0
      )
    );
    const taxAmount = roundMoney((subtotal * (value.taxPercent || 0)) / 100);
    return { subtotal, taxAmount, total: roundMoney(subtotal + taxAmount) };
  }, [value.lineItems, value.taxPercent]);

  const patchLine = (idx: number, partial: Partial<IInvoiceLineItem>) => {
    const next = value.lineItems.slice();
    const merged = { ...next[idx], ...partial };
    // If hours or rate changed, re-derive amount.
    if (partial.hours !== undefined || partial.rate !== undefined) {
      const h = Number(merged.hours || 0);
      const r = Number(merged.rate || 0);
      if (h > 0 && r > 0) merged.amount = roundMoney(h * r);
    }
    next[idx] = merged;
    onChange({ ...value, lineItems: next });
  };

  const addLine = () => {
    onChange({
      ...value,
      lineItems: [
        ...value.lineItems,
        { description: '', amount: 0 },
      ],
    });
  };

  const removeLine = (idx: number) => {
    onChange({
      ...value,
      lineItems: value.lineItems.filter((_, i) => i !== idx),
    });
  };

  return (
    <Stack spacing={2}>
      {canEditMeta && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
            bgcolor: alpha(tokens.colors.pink, 0.03),
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: tokens.colors.pinkDark,
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.66rem',
              display: 'block',
              mb: 1,
            }}
          >
            Invoice meta (admin override)
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              label="Invoice number"
              value={value.invoiceNumber ?? ''}
              onChange={(e) =>
                onChange({ ...value, invoiceNumber: e.target.value })
              }
              helperText="3–40 chars · letters, digits, hyphens"
              sx={{ flex: 1.4, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              type="date"
              label="Issue date"
              InputLabelProps={{ shrink: true }}
              value={value.issueDate ?? ''}
              onChange={(e) =>
                onChange({ ...value, issueDate: e.target.value })
              }
              helperText="Used on the PDF and due-date calc"
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </Box>
      )}

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          sx={{
            bgcolor: alpha(tokens.colors.blue, 0.06),
            px: 2,
            py: 1,
            fontWeight: 700,
            fontSize: '0.75rem',
            color: tokens.colors.blueDark,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <Box sx={{ flex: 3 }}>Description</Box>
          <Box sx={{ flex: 1, textAlign: 'right' }}>Hours</Box>
          <Box sx={{ flex: 1, textAlign: 'right' }}>Rate</Box>
          <Box sx={{ flex: 1, textAlign: 'right' }}>Amount</Box>
          <Box sx={{ width: 36 }} />
        </Stack>
        {value.lineItems.map((li, i) => (
          <Stack
            key={i}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              px: 2,
              py: 1,
              borderTop: '1px solid',
              borderColor: 'grey.100',
            }}
          >
            <TextField
              size="small"
              value={li.description}
              onChange={(e) => patchLine(i, { description: e.target.value })}
              sx={{ flex: 3, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              size="small"
              type="number"
              inputProps={{ min: 0, step: 0.25 }}
              value={li.hours ?? ''}
              onChange={(e) =>
                patchLine(i, {
                  hours: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              size="small"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={li.rate ?? ''}
              onChange={(e) =>
                patchLine(i, {
                  rate: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              size="small"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={li.amount}
              onChange={(e) => patchLine(i, { amount: Number(e.target.value) })}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <IconButton
              size="small"
              onClick={() => removeLine(i)}
              sx={{ color: '#EF4444' }}
            >
              <IconTrash size={14} />
            </IconButton>
          </Stack>
        ))}
        <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'grey.100' }}>
          <Button
            size="small"
            startIcon={<IconPlus size={14} />}
            onClick={addLine}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: tokens.colors.pinkDark,
              borderRadius: 2,
            }}
          >
            Add line item
          </Button>
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField
          size="small"
          label="Tax label"
          value={value.taxLabel || ''}
          onChange={(e) => onChange({ ...value, taxLabel: e.target.value })}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          size="small"
          type="number"
          label="Tax %"
          inputProps={{ min: 0, step: 0.01 }}
          value={value.taxPercent}
          onChange={(e) =>
            onChange({ ...value, taxPercent: Number(e.target.value) || 0 })
          }
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Stack>

      <TextField
        size="small"
        label="Notes on invoice"
        multiline
        minRows={2}
        value={value.notes || ''}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={3}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: alpha(tokens.colors.pink, 0.04),
          border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
        }}
      >
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Subtotal
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>
            {formatMoney(subtotal, currency)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Tax
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>
            {formatMoney(taxAmount, currency)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Total
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: tokens.colors.pinkDark }}>
            {formatMoney(total, currency)}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}

export type { DraftEditorState };
