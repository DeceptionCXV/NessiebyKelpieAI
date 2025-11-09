import { useState, useEffect } from 'react';
import { OutreachSystem } from './OutreachSystem';
import { FailedWebsitesPage } from './nessie/FailedWebsitesPage';
import { DocsPage } from '../pages/DocsPage';
import { SeedPage } from '../pages/SeedPage';

export const Router = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  switch (currentPath) {
    case '/':
      return <OutreachSystem />;
    case '/nessie':
      return <FailedWebsitesPage />;
    case '/docs':
      return <DocsPage />;
    case '/dev/seed':
      return <SeedPage />;
    default:
      return <OutreachSystem />;
  }
};
