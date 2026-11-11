# GetKaze (working name)

Multi-business platform for Rwanda, starting in Musanze. Owners and staff see "Kaze"; guests only see each business's own brand.

Planning documents, specs and mockups for the platform. App code starts in the first Claude Code session (EXECUTION_PLAN day 4).

## Start the repository
```
cd getkaze
git init
git add .
git commit -m "Docs, specs and mockups from Chat 1 and Chat 2"
gh repo create getkaze --private --source=. --push
```
(Or create an empty private repo on GitHub and follow its "push an existing repository" steps.)

## Where things are
- docs/ — project files (source of truth), with Chat 2 decisions D-038 to D-050
- docs/MOCKUPS.md — every approved screen and its links
- mockups/ — canvas source files and motion preview pages
- specs/ — first feature specs and backlog
- CLAUDE.md — guide for Claude Code

## First Claude Code session
"Read CLAUDE.md, docs/PROJECT.md, docs/DECISIONS.md and docs/EXECUTION_PLAN.md. Set up the monorepo for day 4 and give me a plan before writing code."
