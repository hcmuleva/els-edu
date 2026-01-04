import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

/**
 * A floating button that appears when the user scrolls down
 * and allows them to scroll back to the top of the container.
 *
 * @param {string} containerSelector - Selector for the scrollable container. Defaults to "main".
 */
const ScrollToTopButton = ({ containerSelector = "main" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const toggleVisibility = () => {
      // Show button when scrolled down more than 300px
      if (container.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    container.addEventListener("scroll", toggleVisibility);

    // Initial check
    toggleVisibility();

    return () => container.removeEventListener("scroll", toggleVisibility);
  }, [containerSelector]);

  const scrollToTop = () => {
    const container = document.querySelector(containerSelector);
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-28 right-6 md:bottom-10 md:right-10 z-50 p-3 bg-gradient-to-r from-primary-500 to-violet-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-90 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 group"
      aria-label="Scroll to top"
      title="Scroll to Top"
    >
      <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
    </button>
  );
};

export default ScrollToTopButton;
