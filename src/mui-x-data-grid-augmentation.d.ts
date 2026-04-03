import type { Dispatch, SetStateAction } from 'react';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    setFilterButtonEl: Dispatch<SetStateAction<HTMLButtonElement | null>>;
  }
}
