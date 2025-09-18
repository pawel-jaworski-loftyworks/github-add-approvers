
// content.js - injects a floating button to add reviewers on GitHub PR pages.

(function () {
  const BTN_ID = "gpae-add-reviewers-btn";
  const PANEL_ID = "gpae-panel";

  function onReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    }
  }

  function parsePRUrl() {
    // Expected: https://github.com/{owner}/{repo}/pull/{number}
    const parts = location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("pull");
    if (idx > 1 && parts[idx + 1]) {
      return { owner: parts[0], repo: parts[1], number: parts[idx + 1] };
    }
    return null;
  }

  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;

    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.textContent = "Add PR Reviewers";
    btn.title = "Add people or teams as reviewers";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 999999,
      padding: "10px 14px",
      borderRadius: "9999px",
      border: "1px solid rgba(140,140,140,.4)",
      background: "#2da44e",
      color: "white",
      fontWeight: "600",
      boxShadow: "0 4px 14px rgba(0,0,0,.15)",
      cursor: "pointer"
    });
    btn.addEventListener("click", openPanel);
    document.body.appendChild(btn);
  }

  function openPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const host = document.createElement("div");
    host.id = PANEL_ID;
    Object.assign(host.style, {
      position: "fixed",
      bottom: "72px",
      right: "20px",
      zIndex: 1000000,
      width: "360px",
      background: "white",
      border: "1px solid #d0d7de",
      borderRadius: "12px",
      boxShadow: "0 12px 28px rgba(0,0,0,.2)",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif"
    });

    const header = document.createElement("div");
    header.textContent = "Add Reviewers";
    Object.assign(header.style, { padding: "12px 14px", fontWeight: "700", borderBottom: "1px solid #d0d7de" });

    const inner = document.createElement("div");
    Object.assign(inner.style, { padding: "12px 14px", display: "grid", gap: "10px" });

    const hint = document.createElement("div");
    hint.innerHTML = `Enter GitHub usernames and/or team slugs (org/team), comma-separated.<br>
    Example: <code>octocat, my-org/frontend</code>`;
    Object.assign(hint.style, { fontSize: "12px", color: "#57606a" });

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "user1, user2 or org/team";
    Object.assign(input.style, { padding: "10px", border: "1px solid #d0d7de", borderRadius: "8px" });
	
	chrome.storage.sync.get({ defaultReviewers: "" }, (data) => {
	  if (data.defaultReviewers) {
	    input.value = data.defaultReviewers;
	  }
	});

    const status = document.createElement("div");
    Object.assign(status.style, { fontSize: "12px", minHeight: "18px", color: "#57606a" });

    const row = document.createElement("div");
    Object.assign(row.style, { display: "flex", gap: "8px", alignItems: "center" });

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    Object.assign(addBtn.style, {
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid rgba(140,140,140,.4)",
      background: "#2da44e",
      color: "white",
      fontWeight: "600",
      cursor: "pointer",
      flex: "0 0 auto"
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    Object.assign(closeBtn.style, {
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #d0d7de",
      background: "white",
      cursor: "pointer",
      flex: "0 0 auto"
    });
    closeBtn.addEventListener("click", () => {
       chrome.storage.sync.set({ defaultReviewers: input.value.trim() });
       host.remove();
    });

    row.appendChild(addBtn);
    row.appendChild(closeBtn);

    inner.appendChild(hint);
    inner.appendChild(input);
    inner.appendChild(row);
    inner.appendChild(status);

    host.appendChild(header);
    host.appendChild(inner);
    document.body.appendChild(host);

    addBtn.addEventListener("click", async () => {
	  await chrome.storage.sync.set({ defaultReviewers: input.value.trim() });
	  
      const pr = parsePRUrl();
      if (!pr) {
        status.textContent = "Not a PR URL I recognize.";
        return;
      }
      const tokens = (input.value || "").split(",").map(s => s.trim()).filter(Boolean);
      if (!tokens.length) {
        status.textContent = "Please enter at least one username or org/team.";
        return;
      }

      const reviewers = [];
      const team_reviewers = [];
      for (const t of tokens) {
        if (t.includes("/")) team_reviewers.push(t.split("/")[1]); // org/team -> team slug
        else reviewers.push(t);
      }

      // get token from storage
      const { githubPAT, githubApiBase } = await chrome.storage.sync.get({ githubPAT: "", githubApiBase: "https://api.github.com" });
      if (!githubPAT) {
        status.innerHTML = `No token found. Open <a href="chrome-extension://${chrome.runtime.id}/options.html" target="_blank">extension options</a> and save a GitHub PAT.`;
        status.style.color = "#d1242f";
        return;
      }

      status.style.color = "#57606a";
      status.textContent = "Sending request...";

      try {
        const url = `${githubApiBase}/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}/requested_reviewers`;
        const body = { reviewers };
        if (team_reviewers.length) body.team_reviewers = team_reviewers;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `token ${githubPAT}`,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data && data.message ? data.message : `HTTP ${res.status}`);
        }
        status.style.color = "#1a7f37";
        status.textContent = "Reviewers requested successfully.";
      } catch (err) {
        status.style.color = "#d1242f";
        status.textContent = `Error: ${err.message}`;
      }
    });
  }

  // Initialize when ready
  onReady(() => {
    // Only show on PR pages, guard for PJAX navigation
    const pr = parsePRUrl();
    if (pr) ensureButton();

    // Observe URL changes (GitHub uses PJAX)
    let lastPath = location.pathname;
    new MutationObserver(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        const pr2 = parsePRUrl();
        if (pr2) ensureButton();
        else {
          const btn = document.getElementById(BTN_ID);
          if (btn) btn.remove();
          const panel = document.getElementById(PANEL_ID);
          if (panel) panel.remove();
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
