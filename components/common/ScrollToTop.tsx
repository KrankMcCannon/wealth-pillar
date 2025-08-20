import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente per scrollare automaticamente in cima alla pagina ad ogni cambio di route
 * Principio SRP: Single Responsibility - gestisce solo lo scroll
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll in cima alla pagina ad ogni cambio di route
    // Usa setTimeout per assicurarsi che il DOM sia aggiornato
    const timer = setTimeout(() => {
      // Scroll del window
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });

      // Scroll anche del main element se esiste
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};
