import React, { useState, useEffect, useRef } from "react";
import { useGetIdentity, useNotify } from "react-admin";
import { Bell, Check, Trash2, X } from "lucide-react";
import { subscribeToUserNotifications } from "../../services/ably";
import { useNavigate } from "react-router-dom";
import classroomService from "../../services/classroomService";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@mui/material";
import { cn } from "../../lib/utils";

const NotificationBell = ({ children, iconSize = 24 }) => {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const isMobile = useMediaQuery("(max-width:1024px)");

  const userOrgDocumentId = identity?.org?.documentId;
  const userDocumentId = identity?.documentId;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userOrgDocumentId || !userDocumentId) return;

    try {
      const data = await classroomService.getNotifications(
        userOrgDocumentId,
        userDocumentId,
      );
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userOrgDocumentId, userDocumentId]);

  // Real-time subscription
  useEffect(() => {
    if (!userOrgDocumentId || !userDocumentId) return;

    const handleNotification = (eventName, data) => {
      console.log("[Notification] Received:", eventName, data);
      notify(data.title || "New Notification", { type: "info" });

      // Refresh notifications to get the full object
      fetchNotifications();
    };

    const unsubscribe = subscribeToUserNotifications(
      userOrgDocumentId,
      userDocumentId,
      handleNotification,
    );

    return () => unsubscribe();
  }, [userOrgDocumentId, userDocumentId, notify]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const dropdownHeight = 450; // Approximated height
      const padding = 16;

      let nextCoords = {
        top: "auto",
        left: "auto",
        bottom: "auto",
        right: "auto",
      };

      if (isMobile) {
        // MOBILE LOGIC: Usually trigger is at TOP-RIGHT header
        // Default: Pop Down-Left
        nextCoords.top = rect.bottom + 8;

        // Ensure it doesn't overflow right
        if (rect.right < dropdownWidth + padding) {
          nextCoords.left = padding;
        } else {
          nextCoords.left = rect.right - dropdownWidth;
        }

        // Clamp to screen edges
        if (nextCoords.left + dropdownWidth > window.innerWidth - padding) {
          nextCoords.left = window.innerWidth - dropdownWidth - padding;
        }
        if (nextCoords.left < padding) nextCoords.left = padding;
      } else {
        // DESKTOP LOGIC: Trigger is in LEFT SIDEBAR
        // Default: Pop Right
        nextCoords.left = rect.right + 12;

        // Vertical positioning: Try to center it to the trigger, but don't overflow
        const idealTop = rect.top - dropdownHeight / 2 + rect.height / 2;

        if (idealTop + dropdownHeight > window.innerHeight - padding) {
          // Too low - stick to bottom
          nextCoords.bottom = padding;
          nextCoords.top = "auto";
        } else if (idealTop < padding) {
          // Too high - stick to top
          nextCoords.top = padding;
          nextCoords.bottom = "auto";
        } else {
          nextCoords.top = idealTop;
          nextCoords.bottom = "auto";
        }

        // Horizontal safety: If sidebar was somehow on the right
        if (nextCoords.left + dropdownWidth > window.innerWidth - padding) {
          nextCoords.left = "auto";
          nextCoords.right = window.innerWidth - rect.left + 12;
        }
      }

      setCoords(nextCoords);
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await classroomService.markNotificationRead(id);

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await classroomService.deleteNotification(id);

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      // Recalculate unread (if the deleted one was unread)
      fetchNotifications();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n._id);
    }
    if (n.link) {
      navigate(n.link);
      setIsOpen(false);
    }
  };

  if (!userOrgDocumentId) return null;

  return (
    <>
      <div
        className="relative inline-block w-full cursor-pointer"
        ref={triggerRef}
        onClick={handleToggle}
      >
        {typeof children === "function"
          ? children({ unreadCount })
          : children || (
              <button
                type="button"
                className="relative w-full h-full flex items-center justify-center hover:bg-gray-50 transition-colors group"
              >
                <Bell
                  size={iconSize}
                  className="text-gray-600 lg:text-slate-500 group-hover:text-primary transition-colors"
                />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            )}
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999]" style={{ zIndex: 99999 }}>
            {/* Scrim/Backdrop for closing */}
            <div
              className="absolute inset-0 bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            <div
              className={cn(
                "absolute w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                isMobile ? "slide-in-from-top-2" : "slide-in-from-left-2",
              )}
              style={{
                top: coords.top === "auto" ? "auto" : `${coords.top}px`,
                bottom:
                  coords.bottom === "auto" ? "auto" : `${coords.bottom}px`,
                left: coords.left === "auto" ? "auto" : `${coords.left}px`,
                right: coords.right === "auto" ? "auto" : `${coords.right}px`,
              }}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-800">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                          !n.isRead ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                              !n.isRead ? "bg-blue-500" : "bg-transparent"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${
                                !n.isRead
                                  ? "font-bold text-gray-900"
                                  : "text-gray-600"
                              }`}
                            >
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(n._id);
                                }}
                                className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, n._id)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default NotificationBell;
