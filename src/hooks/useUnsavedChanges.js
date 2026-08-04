import { useEffect, useRef } from 'react';

const DEFAULT_MESSAGE = 'Tienes cambios sin guardar. ¿Quieres salir igualmente?';

export default function useUnsavedChanges(enabled, message = DEFAULT_MESSAGE) {
  const restoringHistory = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const interceptLink = (event) => {
      const target = event.target.closest?.('a[href], [data-confirm-navigation]');
      if (!target || target.target === '_blank' || (target.origin && target.origin !== window.location.origin)) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const interceptHistory = () => {
      if (restoringHistory.current) {
        restoringHistory.current = false;
        return;
      }
      if (!window.confirm(message)) {
        restoringHistory.current = true;
        window.history.forward();
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', interceptLink, true);
    window.addEventListener('popstate', interceptHistory);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', interceptLink, true);
      window.removeEventListener('popstate', interceptHistory);
    };
  }, [enabled, message]);
}
