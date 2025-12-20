import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  useInfiniteGetList,
  useGetIdentity,
  useSidebarState,
} from "react-admin";
import {
  X,
  Search,
  Check,
  RotateCcw,
  User,
  Globe,
  BookOpen,
  FolderTree,
} from "lucide-react";
import { CustomAsyncSelect } from "./CustomAsyncSelect";

export const TopicSelector = ({
  open,
  onClose,
  onSelectTopics,
  selectedIds = [],
}) => {
  const { data: identity } = useGetIdentity();
  const [sidebarOpen] = useSidebarState();

  const [localSelected, setLocalSelected] = useState(selectedIds);
  const [viewMode, setViewMode] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    subject: null,
  });

  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Sync local selection with prop when modal opens or selectedIds changes
  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
    }
  }, [open, selectedIds]);

  // Build filter object for the query
  const queryFilter = useMemo(() => {
    const filter = {};
    if (searchTerm) filter.q = searchTerm;
    if (filters.subject) filter.subject = filters.subject;
    if (viewMode === "my" && identity?.id) filter.creator = identity.id;
    return filter;
  }, [searchTerm, filters, viewMode, identity?.id]);

  // Use React Admin's useInfiniteGetList hook for infinite scrolling
  const {
    data,
    total,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteGetList(
    "topics",
    {
      pagination: { page: 1, perPage: 20 },
      sort: { field: "createdAt", order: "DESC" },
      filter: queryFilter,
      meta: { populate: ["subject", "creator"] },
    },
    {
      enabled: open,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Update fetch guard when fetching state changes
  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Flatten pages into a single array of topics
  const topics = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const resetFilters = () => {
    setFilters({ subject: null });
    setSearchTerm("");
    setLocalSelected([]);
  };

  // Reset scroll position when filters change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchTerm, filters, viewMode]);

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
    const element = sentinelRef.current;
    if (!element || !open) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      root: scrollContainerRef.current,
    });
    observer.observe(element);

    return () => observer.unobserve(element);
  }, [handleObserver, open]);

  const handleToggle = (id) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedTopics = topics.filter((t) => localSelected.includes(t.id));
    onSelectTopics(selectedTopics);
    onClose();
  };

  if (!open) return null;

  const sidebarWidthClass = sidebarOpen ? "left-64" : "left-20";

  return (
    <div
      className={`fixed inset-y-0 right-0 z-[50] flex items-center justify-center p-6 duration-300 transition-all ${sidebarWidthClass}`}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-white/20 relative z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-white z-10 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                Select Topics
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Add topics to your subject{" "}
                {total > 0 && (
                  <span className="text-primary font-bold">
                    • {total} found
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl w-fit mb-6">
            <button
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "all"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-4 h-4" />
              All Topics
            </button>
            <button
              onClick={() => setViewMode("my")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "my"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              My Topics
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-11 pr-4 py-2 rounded-xl border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50/50 focus:bg-white h-[42px]"
              />
            </div>
            <div className="col-span-5">
              <CustomAsyncSelect
                resource="subjects"
                optionText="name"
                value={filters.subject}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, subject: val }))
                }
                placeholder="Filter by Subject"
                className="w-full"
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={resetFilters}
                title="Reset Filters"
                className="w-full h-[42px] flex items-center justify-center rounded-xl border border-border/50 hover:bg-gray-50 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50/50 p-6"
        >
          {isPending && topics.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-3/4" />
                        <div className="h-6 w-16 bg-gray-200 rounded-lg" />
                      </div>
                      <div className="flex gap-3">
                        <div className="h-6 w-16 bg-gray-100 rounded-md" />
                        <div className="h-6 w-20 bg-gray-100 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-bold">No topics found</p>
              <p className="text-sm">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => {
                const isSelected = localSelected.includes(topic.id);

                return (
                  <div
                    key={topic.id}
                    onClick={() => handleToggle(topic.id)}
                    className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white ${
                      isSelected
                        ? "border-primary shadow-sm shadow-primary/10"
                        : "border-transparent hover:border-primary/30 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-gray-200 group-hover:border-primary/50"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <FolderTree className="w-4 h-4 text-indigo-500" />
                            <p className="font-bold text-foreground line-clamp-2 text-base">
                              {topic.name || "Untitled Topic"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
                          {topic.subject?.name && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md border border-amber-100">
                              <BookOpen className="w-3 h-3 text-amber-500" />
                              <span className="text-xs font-medium text-amber-700">
                                {topic.subject.name}
                              </span>
                            </span>
                          )}

                          {topic.description && (
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">
                              {topic.description}
                            </span>
                          )}

                          {topic.creator?.username && (
                            <span className="flex items-center gap-1.5 text-gray-500">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[100px] text-xs">
                                {topic.creator.username}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />

              {/* Loading indicator */}
              {isFetchingNextPage && (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-bounce" />
                  </div>
                  <span className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Loading more topics...
                  </span>
                </div>
              )}

              {/* End of list indicator */}
              {!hasNextPage && topics.length > 0 && (
                <div className="py-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                  — End of list —
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-white flex items-center justify-between z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              {localSelected.length}
            </span>
            topics selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border-2 border-border/50 font-bold text-muted-foreground hover:bg-gray-50 hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={localSelected.length === 0}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Add Selected Topics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
