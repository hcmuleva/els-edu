import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useInfiniteGetList } from "react-admin";
import { X, Search } from "lucide-react";

const CountListInfiniteModal = ({
  isOpen,
  onClose,
  title,
  resource,
  filter,
}) => {
  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Infinite Scroll Hook
  const {
    data,
    isLoading,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteGetList(
    resource,
    {
      pagination: { page: 1, perPage: 20 },
      sort: { field: "name", order: "ASC" }, // Assuming 'name' or main display field
      filter: filter || {},
    },
    {
      enabled: isOpen && !!resource,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Flatten pages
  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data]
  );
  const total = data?.pages[0]?.meta?.pagination?.total || 0;

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingRef.current) {
        isFetchingRef.current = true;
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !isOpen) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      root: scrollContainerRef.current,
    });
    observer.observe(element);

    return () => observer.unobserve(element);
  }, [handleObserver, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md h-[500px] flex flex-col animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-800">{title}</h3>
            {total > 0 && (
              <p className="text-xs text-gray-500 font-medium">
                {total} items found
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2">
          {items.length === 0 && !isPending && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-sm font-medium">No items found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all select-none"
                >
                  {item.name || item.title || item.username || "Untitled"}
                  {item.grade && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-white border border-gray-200 rounded text-gray-500">
                      {item.grade}
                    </span>
                  )}
                </div>
              ))}

              {/* Sentinel */}
              <div ref={sentinelRef} className="h-4 w-full" />

              {(isFetchingNextPage || isLoading) && (
                <div className="py-4 flex justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountListInfiniteModal;
