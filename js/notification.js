/**
 * UstadJi - Notifications Module
 */

const NotificationModule = {
  async loadList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="animate-pulse space-y-3">
        ${[1, 2, 3, 4].map(() => `<div class="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>`).join("")}
      </div>
    `;

    try {
      const data = await API.notifications.list();
      const items = data.results || data.items || data || [];

      if (!items.length) {
        container.innerHTML = Helper.emptyState("No notifications", "fa-bell-slash");
        return;
      }

      container.innerHTML = items.map((n) => this.renderItem(n)).join("");
      this.updateBadge();
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message, () => this.loadList(containerId));
    }
  },

  renderItem(n) {
    const unread = !n.is_read && !n.read;
    const icons = {
      booking: "fa-calendar-check",
      payment: "fa-credit-card",
      review: "fa-star",
      profile: "fa-user",
      cancellation: "fa-times-circle",
      registration: "fa-user-plus",
      login: "fa-sign-in-alt",
    };
    const icon = icons[n.type] || "fa-bell";

    return `
      <div class="flex items-start gap-3 p-4 rounded-xl transition-colors ${unread ? "bg-primary-50 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"} border border-transparent ${unread ? "border-primary-100 dark:border-primary-900/30" : ""}" data-id="${n.id}">
        <div class="w-10 h-10 rounded-full ${unread ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"} flex items-center justify-center flex-shrink-0">
          <i class="fas ${icon}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 dark:text-white ${unread ? "font-semibold" : ""}">${n.title || n.message}</p>
          ${n.body || n.description ? `<p class="text-xs text-slate-500 mt-0.5 line-clamp-2">${n.body || n.description}</p>` : ""}
          <p class="text-xs text-slate-400 mt-1">${Helper.timeAgo(n.created_at)}</p>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          ${unread ? `<button onclick="NotificationModule.markRead('${n.id}')" class="p-1.5 text-slate-400 hover:text-primary-600" title="Mark as read"><i class="fas fa-check"></i></button>` : ""}
          <button onclick="NotificationModule.delete('${n.id}')" class="p-1.5 text-slate-400 hover:text-rose-500" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `;
  },

  async markRead(id) {
    try {
      await API.notifications.markRead(id);
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el) {
        el.classList.remove("bg-primary-50", "dark:bg-primary-900/10", "border-primary-100");
        el.querySelector("button[title='Mark as read']")?.remove();
      }
      this.updateBadge();
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  async markAllRead() {
    try {
      await API.notifications.markAllRead();
      Helper.toast("All marked as read", "success");
      this.loadList("notifications-list");
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  async delete(id) {
    try {
      await API.notifications.delete(id);
      document.querySelector(`[data-id="${id}"]`)?.remove();
      this.updateBadge();
      Helper.toast("Notification deleted", "info");
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  async updateBadge() {
    try {
      const data = await API.notifications.unreadCount();
      const count = data.count ?? data.unread ?? 0;
      document.querySelectorAll("[data-notification-badge]").forEach((el) => {
        if (count > 0) {
          el.textContent = count > 99 ? "99+" : count;
          el.classList.remove("hidden");
        } else {
          el.classList.add("hidden");
        }
      });
    } catch {
      // silent
    }
  },

  /**
   * Poll for new notifications (simple interval)
   */
  startPolling(intervalMs = 60000) {
    this.updateBadge();
    setInterval(() => this.updateBadge(), intervalMs);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  if (Auth.isAuthenticated()) {
    NotificationModule.startPolling();
  }
});
