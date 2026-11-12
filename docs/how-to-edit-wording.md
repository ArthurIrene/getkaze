# How to edit wording (Kinyarwanda and English)

For the owner: change a word on the site without a developer, from a browser. Until the Wording editor arrives in Batch 3 (D-061), wording lives in two files:

- `apps/web/messages/en.json` (English, required)
- `apps/web/messages/rw.json` (Kinyarwanda; a missing or empty key falls back to English)

Check docs/kinyarwanda-glossary.md first, so the same English term always gets the same Kinyarwanda word.

## Steps (GitHub in the browser)
1. Open the repository on GitHub and go to `apps/web/messages/rw.json`.
2. Click the pencil icon ("Edit this file").
3. Find the key, for example `"perNight": "ku ijoro"`, and change only the text **inside the second pair of quotes**. Keep the quotes, the colon and the comma at the end of the line.
   - Leave anything in curly braces as it is: `{name}`, `{n}`, `{room}` are filled in by the site.
   - Words such as `plural`, `one`, `other`, `select` and `#` are part of the format; change only the words around them.
4. Click **Commit changes…**, choose **"Create a new branch for this commit and start a pull request"**, give the branch a short name such as `wording/rw-rooms`, and click **Propose changes**.
5. On the next page, set the base branch to **`staging`** and click **Create pull request**. Write one line on what you changed.
6. Wait for **CI** (the checks at the bottom of the pull request, about 3 minutes). Green means the file is still valid and every page still works. Red usually means a missing quote or comma: open "Details", fix the line, commit again to the same branch.
7. When CI is green, click **Merge pull request**. The staging site (getkaze.vercel.app) shows the change a few minutes later.
8. Mark the term `checked` in docs/kinyarwanda-glossary.md (same steps) if you settled it.

## Good to know
- One pull request can hold several word changes; keep it to one topic.
- Never edit `en.json` keys (the part before the colon); only the text after it.
- If you are unsure about a word, leave it and add a note in the pull request instead.
