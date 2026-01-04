import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = ({ containerSelector = "main" }) => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    // Only scroll to top on PUSH (new page) or REPLACE
    // On POP (back/forward), let the browser handle scroll restoration
    if (navType !== "POP") {
      // 1. Reset Window Scroll (standard)
      window.scrollTo(0, 0);

      // 2. Reset Container Scroll
      if (containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
          container.scrollTop = 0;
        }
      }
    }
  }, [pathname, navType, containerSelector]);

  return null;
};

export default ScrollToTop;
