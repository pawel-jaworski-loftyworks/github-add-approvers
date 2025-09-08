
# GitHub PR Authorizers (Chrome Extension)

This extension adds a small floating button on GitHub Pull Request pages that lets you request reviewers (people or org teams) quickly.

## What it does
- Detects PR pages like `https://github.com/{owner}/{repo}/pull/{number}`.
- Adds a button **Add PR Reviewers**.
- Lets you enter comma‑separated GitHub usernames and/or teams (`org/team` format).
- Calls GitHub's API to request those reviewers on the current PR.

## Setup
1. Create a **GitHub Personal Access Token**:
   - For **github.com**: either a classic token with `repo` scope, or a fine‑grained token with **Pull requests: Read & Write** permission for the repositories you need.
   - For **GitHub Enterprise Server**: use your GHES API base URL like `https://ghe.example.com/api/v3`.
2. Install the extension:
   - `chrome://extensions` → **Developer mode** → **Load unpacked** → select the folder of this project.
3. Open the extension **Options** and paste your token. (Optional) set API base for GHES.
4. Go to a PR and click **Add PR Reviewers**.

## Notes
- Teams must be entered as `org/team` and your token must have permission in that org. The extension uses the `team_reviewers` field when present.
- GitHub may limit who can request reviewers. You need access to the repo and permission to request reviewers.
- The extension only runs on `https://github.com/*/*/pull/*`. Adjust `manifest.json` if you want broader matches.

## Privacy
- Your token is stored via `chrome.storage.sync` and used only to call GitHub's API from your browser.
- No data leaves your machine except the API requests you trigger.
