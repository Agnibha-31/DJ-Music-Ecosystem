import { useEffect, useRef, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import DJApp from '../apps/dj/src/App';
import QueueApp from '../apps/queue/src/App';
import { adminRoutes } from '../apps/admin/src/routes';
import { BackgroundAnimation } from '../apps/admin/src/components/BackgroundAnimation';
import { ParticleField } from '../apps/admin/src/components/ParticleField';
import { MobileOptimizer } from '../apps/admin/src/components/MobileOptimizer';
import adminIndexCss from '../apps/admin/src/index.css?raw';
import djIndexCss from '../apps/dj/src/index.css?raw';
import queueIndexCss from '../apps/queue/src/index.css?raw';

const ADMIN_BASE = '/admin';

const getPathname = () => window.location.pathname;

const getSegment = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized.split('/')[1] ?? '';
};

export default function Router() {
  const [pathname, setPathname] = useState(getPathname);
  const adminRouterRef = useRef<ReturnType<typeof createBrowserRouter> | null>(null);

  // Create the admin router lazily on first use so it reads the current URL
  const getAdminRouter = () => {
    if (!adminRouterRef.current) {
      adminRouterRef.current = createBrowserRouter(adminRoutes, { basename: ADMIN_BASE });
    }
    return adminRouterRef.current;
  };

  useEffect(() => {
    const onLocationChange = () => setPathname(getPathname());

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args as any);
      onLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args as any);
      onLocationChange();
    };

    window.addEventListener('popstate', onLocationChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', onLocationChange);
    };
  }, []);

  const segment = getSegment(pathname);

  useEffect(() => {
    const stylesheetId = 'unified-active-app-css';
    let styleEl = document.getElementById(stylesheetId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = stylesheetId;
      document.head.appendChild(styleEl);
    }

    if (segment === 'admin') {
      styleEl.textContent = adminIndexCss;
      return;
    }

    if (segment === 'dj') {
      styleEl.textContent = djIndexCss;
      return;
    }

    styleEl.textContent = queueIndexCss;
  }, [segment]);

  if (segment === 'admin') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <BackgroundAnimation />
        <ParticleField />
        <MobileOptimizer />

        <div className="relative z-10">
          <RouterProvider router={getAdminRouter()} />
        </div>
      </div>
    );
  }

  if (segment === 'dj') {
    return <DJApp />;
  }

  if (segment === 'queue') {
    return <QueueApp />;
  }

  // Default: check for venue param for Queue (QR codes), otherwise redirect to Admin
  const hasVenueParam = new URLSearchParams(window.location.search).has('venue');
  if (hasVenueParam) {
    return <QueueApp />;
  }

  // No venue param at root -> Redirect to Admin Login
  window.history.replaceState(null, '', '/admin/login');
  window.location.reload(); // Force reload to pick up admin route and new basename
  return null;
}
