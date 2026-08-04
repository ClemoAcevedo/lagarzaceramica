import { useEffect, useRef } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

const DEFAULT_MESSAGE = 'Tienes cambios sin guardar. ¿Quieres salir igualmente?';

export default function useUnsavedChanges(enabled, message = DEFAULT_MESSAGE) {
  const allowNextNavigation = useRef(false);
  const blocker = useBlocker(() => {
    if (!enabled) return false;
    if (allowNextNavigation.current) {
      allowNextNavigation.current = false;
      return false;
    }
    return true;
  });

  useBeforeUnload((event) => {
    if (!enabled) return;
    event.preventDefault();
    event.returnValue = '';
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(message)) blocker.proceed();
    else blocker.reset();
  }, [blocker, message]);

  useEffect(() => {
    if (!enabled) return undefined;
    const interceptAction = (event) => {
      const target = event.target.closest?.('[data-confirm-navigation]');
      if (!target) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      allowNextNavigation.current = true;
    };

    document.addEventListener('click', interceptAction, true);
    return () => {
      document.removeEventListener('click', interceptAction, true);
    };
  }, [enabled, message]);
}
