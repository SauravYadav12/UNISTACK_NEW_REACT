import { useEffect } from 'react';

interface iProps {
  onSubmit: (e: KeyboardEvent) => void;
  submitIf?: boolean;
}

function useHardKeySubmit(
  { onSubmit, submitIf = true }: iProps,
  dependencies: any[] = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's' && submitIf) {
        event.preventDefault();
        onSubmit(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSubmit, submitIf, ...dependencies]);

  return;
}

export default useHardKeySubmit;
