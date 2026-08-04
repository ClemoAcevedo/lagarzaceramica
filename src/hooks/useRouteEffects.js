import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

function useScrollRestoration(pathname, hash, navigationType) {
  useEffect(() => {
    if (navigationType === 'POP') return undefined;

    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, navigationType, pathname]);
}

function useRouteFocus(pathname) {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector('main h1');
      if (!heading) return;
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
}

function useRevealAnimations(pathname) {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealSelector = '.reveal, .image-reveal';

    const forEachReveal = (root, callback) => {
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      if (root.matches(revealSelector)) callback(root);
      root.querySelectorAll(revealSelector).forEach(callback);
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      const show = (item) => item.classList.add('is-visible');
      document.querySelectorAll(revealSelector).forEach(show);

      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => forEachReveal(node, show));
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      return () => mutationObserver.disconnect();
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '240px 0px 240px' });

    const observe = (item) => observer.observe(item);
    document.querySelectorAll(revealSelector).forEach(observe);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => forEachReveal(node, observe));
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);
}

export default function useRouteEffects() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  useScrollRestoration(pathname, hash, navigationType);
  useRouteFocus(pathname);
  useRevealAnimations(pathname);
}
