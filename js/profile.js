/**
 * UstadJi - Profile Module
 */

const ProfileModule = {
  async loadUserProfile() {
    if (!Auth.requireAuth()) return;

    try {
      const profile = await API.profile.get();
      this.fillProfileForm(profile);
      Auth.setUser(profile, Auth.getRole());
      Auth.updateHeaderUI();
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  fillProfileForm(p) {
    const fields = {
      "profile-name": p.full_name || p.name,
      "profile-email": p.email,
      "profile-phone": p.phone,
      "profile-gender": p.gender,
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    });

    const avatar = document.getElementById("profile-avatar-img");
    if (avatar && p.avatar_url) {
      avatar.src = p.avatar_url;
      avatar.classList.remove("hidden");
    }
  },

  async updateProfile(e) {
    e.preventDefault();
    const form = e.target;
    const { valid } = Validation.validateForm(form);
    if (!valid) return;

    const data = Object.fromEntries(new FormData(form));
    try {
      Helper.showLoader();
      const updated = await API.profile.update(data);
      Auth.setUser(updated, Auth.getRole());
      Helper.toast("Profile updated successfully", "success");
      Auth.updateHeaderUI();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  async uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Helper.toast("Image must be under 2MB", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      Helper.showLoader();
      const res = await API.profile.uploadAvatar(formData);
      const avatar = document.getElementById("profile-avatar-img");
      if (avatar && res.avatar_url) {
        avatar.src = res.avatar_url;
        avatar.classList.remove("hidden");
      }
      Helper.toast("Avatar updated", "success");
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  async loadAddresses(containerId = "addresses-list") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const data = await API.profile.addresses();
      const addresses = data.results || data.items || data || [];

      if (!addresses.length) {
        container.innerHTML = Helper.emptyState("No saved addresses", "fa-map-marker-alt");
        return;
      }

      container.innerHTML = addresses
        .map(
          (a) => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
          <div>
            <p class="font-medium text-slate-800 dark:text-white text-sm">${a.label || "Address"} ${a.is_default ? '<span class="text-xs text-primary-600">(Default)</span>' : ""}</p>
            <p class="text-xs text-slate-500 mt-1">${a.address_line1 || a.line1}${a.address_line2 ? ", " + a.address_line2 : ""}</p>
            <p class="text-xs text-slate-500">${a.city}, ${a.state || ""} - ${a.pincode || a.postal_code}</p>
            <p class="text-xs text-slate-500">${a.phone || ""}</p>
          </div>
          <div class="flex gap-1">
            <button onclick="ProfileModule.deleteAddress('${a.id}')" class="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
              <i class="fas fa-trash-alt text-sm"></i>
            </button>
          </div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message);
    }
  },

  async deleteAddress(id) {
    if (!confirm("Delete this address?")) return;
    try {
      await API.profile.deleteAddress(id);
      Helper.toast("Address deleted", "success");
      this.loadAddresses();
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  async addAddress(e) {
    e.preventDefault();
    const form = e.target;
    const { valid } = Validation.validateForm(form);
    if (!valid) return;

    const data = Object.fromEntries(new FormData(form));
    try {
      Helper.showLoader();
      await API.profile.addAddress(data);
      Helper.toast("Address added", "success");
      form.reset();
      this.loadAddresses();
      document.getElementById("add-address-form-wrapper")?.classList.add("hidden");
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  // Worker profile
  async loadWorkerProfile() {
    if (!Auth.requireAuth("worker")) return;

    try {
      const profile = await API.profile.workerProfile();
      this.fillWorkerForm(profile);
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  fillWorkerForm(p) {
    const fields = {
      "worker-name": p.full_name || p.name,
      "worker-email": p.email,
      "worker-phone": p.phone,
      "worker-bio": p.bio || p.about,
      "worker-experience": p.experience_years || p.experience,
      "worker-rate": p.hourly_rate || p.price,
      "worker-area": p.service_area || p.city,
      "worker-languages": p.languages,
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    });
  },

  async updateWorkerProfile(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    try {
      Helper.showLoader();
      await API.profile.updateWorkerProfile(data);
      Helper.toast("Profile updated", "success");
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  async uploadKYC(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      Helper.showLoader();
      await API.profile.uploadKYC(formData);
      Helper.toast("KYC documents uploaded successfully", "success");
      form.reset();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },
};
