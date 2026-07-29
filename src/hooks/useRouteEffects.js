import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useScrollRestoration(pathname, hash) {
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname]);
}

function useRevealAnimations(pathname) {
  useEffect(() => {
    const items = document.querySelectorAll('.reveal, .image-reveal');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '240px 0px 240px' });

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [pathname]);
}

export default function useRouteEffects() {
  const { pathname, hash } = useLocation();
  useScrollRestoration(pathname, hash);
  useRevealAnimations(pathname);
}
