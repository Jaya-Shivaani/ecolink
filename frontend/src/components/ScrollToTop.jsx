import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reusable React ScrollToTop component compatible with React Router v6.
 * Ensures every route navigation or search query change resets window scroll to the top.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll instantly to top-left corner
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
