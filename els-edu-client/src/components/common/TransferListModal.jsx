import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Search } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * TransferListModal - Two-panel modal for assigning/removing items
 * Extracted from OrgManagePage for reuse
 */
export const TransferListModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  availableItems = [],
  assignedItems = [],
  onSave,
  loading = false,
  itemLabel = "name",
  itemSecondaryLabel = null,
  // New props for server-side operations
  serverSide = false,
  totalAvailable = 0,
  onPageChange,
  onSearch,
}) => {
  const [selected, setSelected] = useState(new Set());
  const [localAssigned, setLocalAssigned] = useState([]);
  const [localAvailable, setLocalAvailable] = useState([]);
  const [availableSearch, setAvailableSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [assignedPage, setAssignedPage] = useState(1);
  const pageSize = serverSide ? 20 : 10;

  useEffect(() => {
    if (isOpen) {
      setAvailablePage(1);
      setAssignedPage(1);
      setAvailableSearch("");
      setAssignedSearch("");
      setSelected(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    setLocalAssigned(assignedItems || []);
    if (!serverSide) {
      setLocalAvailable(availableItems || []);
    }
  }, [availableItems, assignedItems, isOpen, serverSide]);

  // Debounce search for server-side
  useEffect(() => {
    if (serverSide && onSearch) {
      const timer = setTimeout(() => {
        setAvailablePage(1);
        onSearch(availableSearch, 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [availableSearch, serverSide]);

  // Handle page change for server-side
  const handleAvailablePageChange = (newPage) => {
    setAvailablePage(newPage);
    if (serverSide && onPageChange) {
      onPageChange(newPage, availableSearch);
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const moveToAssigned = () => {
    if (serverSide) {
      // In server-side mode, availableItems are just the current page.
      // We find items in availableItems matching selection.
      const toMove = availableItems.filter((item) =>
        selected.has(item.documentId || item.id)
      );
      setLocalAssigned([...localAssigned, ...toMove]);
      // We do NOT remove from availableItems strictly in UI because it's server generated,
      // but we could visually hide them or let the user refresh.
      // Creating a local exclusion list or just letting them stay until refresh?
      // Standard transfer list behavior: they move.
      // For server-side, we might want to locally hide them?
      // Let's assume onSave reloads everything.
      // For UI consistency, we can filter them out of display if we want, but simplest is:
      // Just add to assigned.
      // But wait, if we move them, they should disappear from left.
      // We can add them to a "hidden" set?
      // Actually, let's keep it simple: Just add to assigned. The user can see they are in assigned.
    } else {
      const toMove = localAvailable.filter((item) =>
        selected.has(item.documentId || item.id)
      );
      setLocalAssigned([...localAssigned, ...toMove]);
      setLocalAvailable(
        localAvailable.filter(
          (item) => !selected.has(item.documentId || item.id)
        )
      );
    }
    setSelected(new Set());
  };

  const moveToAvailable = () => {
    const toMove = localAssigned.filter((item) =>
      selected.has(item.documentId || item.id)
    );
    // If serverSide, we don't necessarily add them back to "localAvailable" array for display
    // because that array is controlled by props.
    // However, they are removed from 'assigned' list.
    // They should theoretically reappear in 'available' if we searched for them?
    // For now, just removing from assigned is enough.
    setLocalAssigned(
      localAssigned.filter((item) => !selected.has(item.documentId || item.id))
    );
    // If not serverSide, push back to available
    if (!serverSide) {
      setLocalAvailable([...localAvailable, ...toMove]);
    }
    setSelected(new Set());
  };

  // Filter and paginate (Client Side Logic)
  const filteredAvailable = serverSide
    ? availableItems.filter((item) => {
        const isAssigned = localAssigned.some(
          (assigned) =>
            (assigned.documentId || assigned.id) ===
            (item.documentId || item.id)
        );
        return !isAssigned;
      })
    : localAvailable.filter((item) =>
        (item[itemLabel] || item.name || "")
          .toLowerCase()
          .includes(availableSearch.toLowerCase())
      );

  const filteredAssigned = localAssigned.filter((item) =>
    (item[itemLabel] || item.name || "")
      .toLowerCase()
      .includes(assignedSearch.toLowerCase())
  );

  const paginatedAvailable = serverSide
    ? filteredAvailable
    : filteredAvailable.slice(
        (availablePage - 1) * pageSize,
        availablePage * pageSize
      );

  const paginatedAssigned = filteredAssigned.slice(
    (assignedPage - 1) * pageSize,
    assignedPage * pageSize
  );

  const availableTotalPages = serverSide
    ? Math.ceil(totalAvailable / pageSize)
    : Math.ceil(filteredAvailable.length / pageSize);
  const assignedTotalPages = Math.ceil(filteredAssigned.length / pageSize);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 h-full">
            {/* Available List */}
            <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-2">
                  Available (
                  {serverSide ? totalAvailable : filteredAvailable.length})
                </h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    value={availableSearch}
                    onChange={(e) => {
                      setAvailableSearch(e.target.value);
                      if (!serverSide) setAvailablePage(1);
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[250px] max-h-[300px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {paginatedAvailable.map((item) => (
                  <div
                    key={item.documentId || item.id}
                    onClick={() => toggleSelect(item.documentId || item.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                      selected.has(item.documentId || item.id)
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div className="font-medium text-gray-800">
                      {item[itemLabel] || item.name || item.title}
                    </div>
                    {itemSecondaryLabel && item[itemSecondaryLabel] && (
                      <div className="text-xs text-gray-500">
                        {item[itemSecondaryLabel]}
                      </div>
                    )}
                  </div>
                ))}
                {paginatedAvailable.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No items available
                  </p>
                )}
              </div>
              {availableTotalPages > 1 && (
                <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {availablePage} / {availableTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        handleAvailablePageChange(
                          Math.max(1, availablePage - 1)
                        )
                      }
                      disabled={availablePage === 1}
                      className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        handleAvailablePageChange(
                          Math.min(availableTotalPages, availablePage + 1)
                        )
                      }
                      disabled={availablePage >= availableTotalPages}
                      className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex md:flex-col items-center justify-center gap-2 py-2 md:py-0">
              <button
                onClick={moveToAssigned}
                disabled={
                  ![...selected].some((id) =>
                    localAvailable.find((i) => (i.documentId || i.id) === id)
                  )
                }
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary disabled:opacity-40 transition-all rotate-90 md:rotate-0"
                title="Assign selected"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={moveToAvailable}
                disabled={
                  ![...selected].some((id) =>
                    localAssigned.find((i) => (i.documentId || i.id) === id)
                  )
                }
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary disabled:opacity-40 transition-all rotate-90 md:rotate-0"
                title="Remove selected"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Assigned List */}
            <div className="flex flex-col border border-emerald-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-700 mb-2">
                  Assigned ({filteredAssigned.length})
                </h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    value={assignedSearch}
                    onChange={(e) => {
                      setAssignedSearch(e.target.value);
                      setAssignedPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[250px] max-h-[300px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {paginatedAssigned.map((item) => (
                  <div
                    key={item.documentId || item.id}
                    onClick={() => toggleSelect(item.documentId || item.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                      selected.has(item.documentId || item.id)
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div className="font-medium text-gray-800">
                      {item[itemLabel] || item.name || item.title}
                    </div>
                    {itemSecondaryLabel && item[itemSecondaryLabel] && (
                      <div className="text-xs text-gray-500">
                        {item[itemSecondaryLabel]}
                      </div>
                    )}
                  </div>
                ))}
                {paginatedAssigned.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No items assigned
                  </p>
                )}
              </div>
              {assignedTotalPages > 1 && (
                <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {assignedPage} / {assignedTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAssignedPage((p) => Math.max(1, p - 1))}
                      disabled={assignedPage === 1}
                      className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setAssignedPage((p) =>
                          Math.min(assignedTotalPages, p + 1)
                        )
                      }
                      disabled={assignedPage >= assignedTotalPages}
                      className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localAssigned)}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:transform-none"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TransferListModal;
