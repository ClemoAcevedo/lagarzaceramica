import { useEffect } from 'react';

const DEFAULT_MESSAGE = 'Tienes cambios sin guardar. ¿Quieres salir igualmente?';

export default function useUnsavedChanges(enabled, message = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!enabled) return undefined;

    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const interceptLink = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.origin !== window.location.origin) return;
      if (!window.confirm(message)) event.preventDefault();
    };
    const interceptHistory = () => {
      if (!window.confirm(message)) window.history.forward();
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
