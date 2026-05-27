(function () {
  const loginEl = document.getElementById("adminLogin");
  const panelEl = document.getElementById("adminPanel");
  const listEl = document.getElementById("requestList");
  const passInput = document.getElementById("adminPass");
  const loginBtn = document.getElementById("adminLoginBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const setupEl = document.getElementById("setupNotice");

  let db = null;

  function showLogin() {
    loginEl.style.display = "block";
    panelEl.style.display = "none";
  }

  function showPanel() {
    loginEl.style.display = "none";
    panelEl.style.display = "block";
  }

  function timeAgo(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    return Math.floor(m / 60) + " hr ago";
  }

  function renderRequest(id, data) {
    const lines = (data.lines || []).join("<br>");
    const card = document.createElement("div");
    card.className = "req-card status-" + (data.status || "pending");
    card.innerHTML = `
      <div class="req-meta">${timeAgo(data.createdAt || Date.now())} · <span class="badge">${data.status}</span></div>
      <div class="req-codes">${lines}</div>
      <div class="req-actions"></div>
    `;
    const actions = card.querySelector(".req-actions");

    if (data.status === "pending") {
      const approve = document.createElement("button");
      approve.className = "btn-approve";
      approve.textContent = "Approve";
      approve.onclick = () => updateStatus(id, "approved");

      const deny = document.createElement("button");
      deny.className = "btn-deny";
      deny.textContent = "Deny";
      deny.onclick = () => updateStatus(id, "denied");

      actions.append(approve, deny);
    }

    return card;
  }

  function updateStatus(id, status) {
    db.ref("access_requests/" + id).update({
      status,
      reviewedAt: Date.now(),
    });
  }

  function loadRequests() {
    listEl.innerHTML = "<p class='muted'>Loading…</p>";
    db.ref("access_requests")
      .orderByChild("createdAt")
      .limitToLast(40)
      .once("value")
      .then((snap) => {
        const items = [];
        snap.forEach((child) => {
          items.push({ id: child.key, ...child.val() });
        });
        items.reverse();

        if (!items.length) {
          listEl.innerHTML = "<p class='muted'>No requests yet.</p>";
          return;
        }

        listEl.innerHTML = "";
        const pending = items.filter((i) => i.status === "pending");
        const other = items.filter((i) => i.status !== "pending");

        if (pending.length) {
          const h = document.createElement("h3");
          h.textContent = "Pending (" + pending.length + ")";
          listEl.appendChild(h);
          pending.forEach((i) => listEl.appendChild(renderRequest(i.id, i)));
        }

        if (other.length) {
          const h = document.createElement("h3");
          h.textContent = "Recent";
          listEl.appendChild(h);
          other.forEach((i) => listEl.appendChild(renderRequest(i.id, i)));
        }
      });
  }

  loginBtn?.addEventListener("click", () => {
    if (passInput.value === ADMIN_PASSWORD) {
      sessionStorage.setItem("vianne_admin", "1");
      showPanel();
      loadRequests();
    } else {
      alert("Wrong admin password");
    }
  });

  refreshBtn?.addEventListener("click", loadRequests);

  passInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });

  if (!isFirebaseConfigured()) {
    setupEl.style.display = "block";
    loginEl.style.display = "none";
    panelEl.style.display = "none";
    return;
  }

  db = initFirebase();

  if (sessionStorage.getItem("vianne_admin") === "1") {
    showPanel();
    loadRequests();
    db.ref("access_requests")
      .orderByChild("createdAt")
      .limitToLast(1)
      .on("child_added", loadRequests);
  } else {
    showLogin();
  }
})();
