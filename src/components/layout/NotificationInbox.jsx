"use client";

import { useState, useEffect, useRef } from "react";
import { Inbox, ArrowLeftRight, Flame } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/social/actions";
import { useToast } from "@/context/ToastContext";

export default function NotificationInbox({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const { showToast } = useToast();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Fetch notifications on mount and when currentUser changes
  useEffect(() => {
    async function loadNotifications() {
      if (!currentUser) return;
      try {
        const res = await getNotifications();
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    }
    loadNotifications();
  }, [currentUser]);

  // Click outside detection to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
        showToast("Todas las notificaciones marcadas como leídas.", "success");
      } else {
        showToast(res.error || "No se pudo actualizar.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de red al actualizar notificaciones.", "error");
    }
  };

  const handleNotificationClick = async (notif) => {
    if (notif.is_read) return;
    try {
      const res = await markNotificationAsRead(notif.id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. El Botón del Navbar (El Activador) */}
      <button
        onClick={handleToggle}
        type="button"
        className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors relative cursor-pointer flex items-center justify-center"
        aria-label="Abrir bandeja de notificaciones"
      >
        <Inbox className="w-5 h-5 text-gray-400 hover:text-white transition-colors cursor-pointer" />
        
        {/* El Indicador Rojo */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#18191b] animate-[pulse_2s_infinite]" />
        )}
      </button>

      {/* 2. El Panel Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#18191b] border border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Actividad Reciente
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                type="button"
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Marcar como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/40">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-1">
                <Inbox className="w-6 h-6 opacity-30 text-gray-400 mb-1" />
                <span>No tienes notificaciones</span>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.is_read;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 p-3.5 text-[12px] leading-relaxed transition-colors cursor-pointer select-none ${
                      isUnread ? "bg-gray-800/20" : "hover:bg-gray-800/10"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                    )}

                    {/* Notification Type Icon */}
                    <div className="shrink-0 mt-0.5">
                      {n.type === "trade" ? (
                        <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-gray-300">
                      {n.type === "trade" ? (
                        <span>
                          <strong className="text-white font-semibold">@{n.sender_username}</strong> te ha enviado una propuesta de intercambio por tu <strong className="text-emerald-400 font-semibold">{n.game_title}</strong>.
                        </span>
                      ) : (
                        <span>
                          A <strong className="text-white font-semibold">@{n.sender_username}</strong> le interesa tu <strong className="text-emerald-400 font-semibold">{n.game_title}</strong> (Añadido a sus deseos).
                        </span>
                      )}
                      
                      {/* Timestamp */}
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleDateString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Ahora mismo"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
