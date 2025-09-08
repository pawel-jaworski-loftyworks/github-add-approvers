const tokenEl = document.getElementById('token');
const apiEl = document.getElementById('apibase');
const statusEl = document.getElementById('status');

async function restore() {
  const { githubPAT, githubApiBase } = await chrome.storage.sync.get({
    githubPAT: "",
    githubApiBase: "https://api.github.com"
  });
  tokenEl.value = githubPAT || "";
  apiEl.value = githubApiBase || "https://api.github.com";
}
restore();

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({
    githubPAT: tokenEl.value.trim(),
    githubApiBase: apiEl.value.trim() || "https://api.github.com"
  });
  statusEl.textContent = "Saved.";
  statusEl.className = "success";
  setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "muted";
  }, 2500);
});
