(function () {
  const PENDING_KEY = "vianne_jck_pending_id";

  const els = {
    setup: document.getElementById("setupNotice"),
    gate: document.getElementById("accessGate"),
    waiting: document.getElementById("waitingPanel"),
    denied: document.getElementById("deniedPanel"),
    lines: document.getElementById("codeLines"),
    linesWait: document.getElementById("codeLinesWait"),
    status: document.getElementById("statusText"),
    copyBtn: document.getElementById("copyBtn"),
    newBtn: document.getElementById("newCodeBtn"),
  };

  let db = null;
  let listenerRef = null;
  let currentRequestId = null;

  function show(panel) {
    [els.setup, els.gate, els.waiting, els.denied].forEach((el) => {
      if (el) el.style.display = "none";
    });
    if (panel) panel.style.display = "block";
  }

  function renderLines(lines) {
    const html = lines
      .map((line) => `<div class="code-line">${line}</div>`)
      .join("");
    if (els.lines) els.lines.innerHTML = html;
    if (els.linesWait) els.linesWait.innerHTML = html;
  }

  function stopListening() {
    if (listenerRef) {
      listenerRef.off();
      listenerRef = null;
    }
  }

  function onApproved(requestId) {
    stopListening();
    setApprovedRequestId(requestId);
    sessionStorage.removeItem(PENDING_KEY);
    window.location.replace("lookup.html");
  }

  function listenForApproval(requestId) {
    stopListening();
    currentRequestId = requestId;
    listenerRef = db.ref("access_requests/" + requestId);
    listenerRef.on("value", (snap) => {
      const data = snap.val();
      if (!data) return;
      if (data.status === "approved") {
        els.status.textContent = "Approved! Opening catalog…";
        onApproved(requestId);
      } else if (data.status === "denied") {
        stopListening();
        sessionStorage.removeItem(PENDING_KEY);
        show(els.denied);
      }
    });
  }

  async function createAccessRequest() {
    const lines = generateAccessLines(6);
    renderLines(lines);

    const ref = db.ref("access_requests").push();
    const requestId = ref.key;
    const payload = {
      lines,
      status: "pending",
      createdAt: Date.now(),
      userAgent: (navigator.userAgent || "").slice(0, 160),
    };

    await ref.set(payload);
    sessionStorage.setItem(PENDING_KEY, requestId);
    show(els.waiting);
    els.status.textContent = "Waiting for approval…";
    listenForApproval(requestId);
  }

  async function resumePending() {
    const requestId = sessionStorage.getItem(PENDING_KEY);
    if (!requestId) return false;

    const snap = await db.ref("access_requests/" + requestId).once("value");
    const data = snap.val();
    if (!data) {
      sessionStorage.removeItem(PENDING_KEY);
      return false;
    }

    renderLines(data.lines || []);
    if (data.status === "approved") {
      onApproved(requestId);
      return true;
    }
    if (data.status === "denied") {
      show(els.denied);
      return true;
    }

    show(els.waiting);
    els.status.textContent = "Still waiting for approval…";
    listenForApproval(requestId);
    return true;
  }

  els.copyBtn?.addEventListener("click", async () => {
    const box = els.lines?.querySelector(".code-line") ? els.lines : els.linesWait;
    const text = Array.from(box.querySelectorAll(".code-line"))
      .map((el) => el.textContent)
      .join("\n");
    try {
      await navigator.clipboard.writeText(
        "Vianne Jewels — JCK 2026 access request:\n\n" + text + "\n\nPlease approve my access."
      );
      els.copyBtn.textContent = "Copied!";
      setTimeout(() => {
        els.copyBtn.textContent = "Copy message";
      }, 2000);
    } catch (e) {
      alert(text);
    }
  });

  els.newBtn?.addEventListener("click", () => {
    stopListening();
    sessionStorage.removeItem(PENDING_KEY);
    show(els.gate);
    createAccessRequest().catch(showError);
  });

  function showError(err) {
    console.error(err);
    els.status.textContent = "Connection error. Check Firebase setup.";
  }

  function start() {
    const approved = getApprovedRequestId();
    if (approved) {
      db = initFirebase();
      if (!db) {
        window.location.replace("lookup.html");
        return;
      }
      db.ref("access_requests/" + approved)
        .once("value")
        .then((snap) => {
          if (snap.val()?.status === "approved") {
            window.location.replace("lookup.html");
          } else {
            clearApprovedRequestId();
            start();
          }
        })
        .catch(() => window.location.replace("lookup.html"));
      return;
    }

    if (!isFirebaseConfigured()) {
      show(els.setup);
      return;
    }

    db = initFirebase();
    show(els.gate);
    resumePending()
      .then((resumed) => {
        if (!resumed) createAccessRequest().catch(showError);
      })
      .catch(showError);
  }

  start();
})();
