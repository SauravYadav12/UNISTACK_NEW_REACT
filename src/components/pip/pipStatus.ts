import { tokens } from '../../theme/theme';
import { PipStatus } from '../../Interfaces/pip';

/** Accent colour + label per PIP status, used by the card + detail dialog. */
export const PIP_STATUS_META: Record<
  PipStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Draft', color: tokens.colors.blueDark },
  active: { label: 'Active', color: tokens.colors.pink },
  successful: { label: 'Successful', color: tokens.colors.success },
  failed: { label: 'Failed', color: tokens.colors.error },
};

/** Extract a human-readable message from an axios error. */
export function errMsg(e: unknown, fallback = 'Something went wrong.'): string {
  return (
    (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
    (e as Error)?.message ||
    fallback
  );
}
