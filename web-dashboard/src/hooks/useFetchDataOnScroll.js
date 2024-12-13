import { useEffect } from "react";

import useFetchData from "hooks/useFetchData";

const useFetchDataOnScroll = ({
  action, condition = true,
  isWindow = false, refHeight = 0, ref, cursor,
}) => {
  const { data, loadState, fetchData } = useFetchData({ action, condition, onLoad: false });

  useEffect(() => {
    const handleScroll = () => {
      const { scrollY, innerHeight } = window;
      const { scrollTop, offsetHeight, scrollHeight } = ref.current || {};
      const scrollPosition = isWindow ? scrollY : scrollTop;
      const viewHeight = isWindow ? innerHeight : offsetHeight;
      const loadPosition = scrollHeight - viewHeight + refHeight;
      if (scrollPosition >= loadPosition && cursor.next && !loadState.loading) {
        fetchData();
      }
    };
    const current = isWindow ? window : ref.current;
    if (current?.addEventListener) {
      current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (current?.removeEventListener) {
        current?.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isWindow, refHeight, ref, cursor, loadState, fetchData]);

  return { data, loadState };
};

export default useFetchDataOnScroll;
