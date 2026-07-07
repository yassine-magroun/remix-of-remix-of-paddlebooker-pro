import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router's <Link> intercepts clicks and never lets the browser do its
 * native "jump to #anchor" behaviour, so CTAs like the navbar's "Réserver"
 * button (to="/#book") silently did nothing when clicked from another route.
 * This restores that behaviour for every client-side navigation.
 */
export function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id = hash.slice(1);
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  return null;
}
