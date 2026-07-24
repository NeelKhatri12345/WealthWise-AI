import { useEffect, useRef, useState } from "react";

export function useHideOnScroll(useWindow: boolean = false) {
  const scrollRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = useWindow ? window : scrollRef.current;
    if (!el && !useWindow) return;

    const getScrollTop = () => {
      if (useWindow) {
        return window.scrollY;
      }
      return (el as HTMLElement).scrollTop;
    };

    const getScrollHeight = () => {
      if (useWindow) {
        return document.documentElement.scrollHeight;
      }
      return (el as HTMLElement).scrollHeight;
    };

    const getClientHeight = () => {
      if (useWindow) {
        return window.innerHeight;
      }
      return (el as HTMLElement).clientHeight;
    };

    const onScroll = () => {
      const y = getScrollTop();
      const maxScroll = getScrollHeight() - getClientHeight();
      const isNearBottom = maxScroll > 0 && y >= maxScroll - 5;

      if (y <= 10) {
        setHeaderVisible(true);
      } else if (y > lastScrollY.current + 5) {
        setHeaderVisible(false);
      } else if (y < lastScrollY.current - 5 && !isNearBottom) {
        setHeaderVisible(true);
      }
      lastScrollY.current = y;
    };

    const target = useWindow ? window : el;
    if (!target) return;

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [useWindow]);

  return { scrollRef, headerVisible };
}
