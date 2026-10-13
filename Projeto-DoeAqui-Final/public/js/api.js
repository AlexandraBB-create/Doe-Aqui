const api = {
  token() {
    return localStorage.getItem("doaaqui_token");
  },

  user() {
    try {
      return JSON.parse(localStorage.getItem("doaaqui_user"));
    } catch {
      return null;
    }
  },

  setSession(data) {
    localStorage.setItem("doaaqui_token", data.token);
    localStorage.setItem("doaaqui_user", JSON.stringify(data.user));
  },

  logout() {
    localStorage.removeItem("doaaqui_token");
    localStorage.removeItem("doaaqui_user");
    location.href = "/";
  },

  async request(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (this.token()) {
      headers.Authorization = `Bearer ${this.token()}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 401 && this.token()) {
        this.logout();
      }

      throw new Error(data.error || "Não foi possível concluir a operação.");
    }

    return data;
  }
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[character]);
}

function requireAuth() {
  if (!api.token()) {
    location.href = "/login.html";
  }
}

function updateNavigation() {
  const authenticated = Boolean(api.token());

  document.querySelectorAll("[data-auth-only]").forEach(element => {
    element.hidden = !authenticated;
  });

  document.querySelectorAll("[data-guest-only]").forEach(element => {
    element.hidden = authenticated;
  });

  document.querySelectorAll("[data-logout]").forEach(element => {
    element.addEventListener("click", api.logout.bind(api));
  });
}

document.addEventListener("DOMContentLoaded", updateNavigation);
