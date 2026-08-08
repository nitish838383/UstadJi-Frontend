/**
 * UstadJi - Form Validation Utilities
 */

const Validation = {
  rules: {
    required: (v) => (v !== null && v !== undefined && String(v).trim() !== "") || "This field is required",
    email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email address",
    phone: (v) => !v || /^[6-9]\d{9}$/.test(String(v).replace(/\s+/g, "")) || "Enter a valid 10-digit Indian mobile number",
    minLength: (min) => (v) => !v || String(v).length >= min || `Minimum ${min} characters required`,
    maxLength: (max) => (v) => !v || String(v).length <= max || `Maximum ${max} characters allowed`,
    password: (v) =>
      !v ||
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v) ||
      "Password must be 8+ chars with upper, lower, number & special character",
    match: (otherId) => (v) => {
      const other = document.getElementById(otherId)?.value;
      return v === other || "Passwords do not match";
    },
    number: (v) => !v || !isNaN(Number(v)) || "Must be a number",
    min: (min) => (v) => !v || Number(v) >= min || `Minimum value is ${min}`,
    max: (max) => (v) => !v || Number(v) <= max || `Maximum value is ${max}`,
    url: (v) => !v || /^https?:\/\/.+/.test(v) || "Enter a valid URL",
    pincode: (v) => !v || /^[1-9][0-9]{5}$/.test(v) || "Enter a valid 6-digit pincode",
  },

  /**
   * Validate a single field
   */
  validateField(value, ruleNames = []) {
    for (const rule of ruleNames) {
      let result;
      if (typeof rule === "string") {
        result = this.rules[rule]?.(value);
      } else if (typeof rule === "function") {
        result = rule(value);
      }
      if (result !== true && result !== undefined) return result;
    }
    return true;
  },

  /**
   * Validate entire form by data-validate attributes
   * data-validate="required|email|minLength:6"
   */
  validateForm(formEl) {
    const errors = {};
    const fields = formEl.querySelectorAll("[data-validate]");
    fields.forEach((field) => {
      const rulesStr = field.getAttribute("data-validate") || "";
      const rules = rulesStr.split("|").map((r) => {
        if (r.includes(":")) {
          const [name, param] = r.split(":");
          if (this.rules[name]) return this.rules[name](param);
        }
        return this.rules[r] || (() => true);
      });
      const result = this.validateField(field.value, rules);
      if (result !== true) {
        errors[field.name || field.id] = result;
        this.showError(field, result);
      } else {
        this.clearError(field);
      }
    });
    return { valid: Object.keys(errors).length === 0, errors };
  },

  showError(field, message) {
    field.classList.add("border-rose-500", "ring-rose-500");
    field.classList.remove("border-slate-300", "dark:border-slate-600");
    let errEl = field.parentElement.querySelector(".field-error");
    if (!errEl) {
      errEl = document.createElement("p");
      errEl.className = "field-error text-xs text-rose-500 mt-1";
      field.parentElement.appendChild(errEl);
    }
    errEl.textContent = message;
  },

  clearError(field) {
    field.classList.remove("border-rose-500", "ring-rose-500");
    field.classList.add("border-slate-300", "dark:border-slate-600");
    const errEl = field.parentElement.querySelector(".field-error");
    if (errEl) errEl.remove();
  },

  /**
   * Clear all errors in form
   */
  clearFormErrors(formEl) {
    formEl.querySelectorAll("[data-validate]").forEach((f) => this.clearError(f));
  },

  /**
   * Live validation on blur
   */
  attachLiveValidation(formEl) {
    formEl.querySelectorAll("[data-validate]").forEach((field) => {
      field.addEventListener("blur", () => {
        const rulesStr = field.getAttribute("data-validate") || "";
        const rules = rulesStr.split("|").map((r) => {
          if (r.includes(":")) {
            const [name, param] = r.split(":");
            if (this.rules[name]) return this.rules[name](param);
          }
          return this.rules[r] || (() => true);
        });
        const result = this.validateField(field.value, rules);
        if (result !== true) this.showError(field, result);
        else this.clearError(field);
      });
    });
  },
};
