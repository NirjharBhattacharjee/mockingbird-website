---
name: coderabbit-loop
description: >
  Iteratively improves a GitHub PR until CodeRabbit's latest review on the head commit has zero
  actionable comments and zero unresolved CodeRabbit threads. Triggers a CodeRabbit review, fixes
  actionable comments, pushes, waits for the incremental review, and repeats. Use when the user wants
  to fully clear a PR against CodeRabbit's review.
license: MIT
compatibility: Requires git, gh (GitHub CLI) authenticated, jq, and the CodeRabbit GitHub app installed on the repo.
metadata:
  derived-from: greploop by greptileai (MIT)
allowed-tools: Bash(gh:*) Bash(git:*) Bash(jq:*)
---

# CodeRabbit loop

Fix a PR until CodeRabbit has nothing left to say: no actionable comments on the head commit, no unresolved CodeRabbit threads.

CodeRabbit has no confidence score. "Done" is read from three places: the `CodeRabbit` commit status, the review it posts for the head commit, and the review threads it opened.

## Inputs

- **PR number** (optional): defaults to the PR for the current branch.
- **`--max-iterations N`** (optional, default **10**): cap on review-fix-push cycles.

## CodeRabbit facts this skill relies on

- Bot login is `coderabbitai[bot]` in REST and `coderabbitai` in GraphQL. Match with `test("coderabbit"; "i")`.
- It reviews every push on its own (incremental review). Only comment `@coderabbitai review` when it hasn't started. `@coderabbitai full review` re-reviews the whole PR from scratch. Use that only when the incremental review seems to have missed files.
- It reports progress as a commit status / check named `CodeRabbit` (pending while reviewing).
- It keeps one summary comment (the walkthrough) and edits it on every review. Each review it posts has a body starting with `**Actionable comments posted: N**`, plus collapsed sections:
  - `⚠️ Outside diff range comments (N)`: real findings on lines outside the diff. They have **no inline thread**, so they only live in the review body.
  - `🧹 Nitpick comments (N)`: optional polish, also only in the review body.
  - `♻️ Duplicate comments (N)`: earlier findings that are still open.
- Inline comments carry a severity label (`⚠️ Potential issue`, `🛠️ Refactor suggestion`, `🧹 Nitpick`, etc.) and often a collapsed `🤖 Prompt for AI Agents` block. Use the prompt as a starting point, but check it against the code.
- When an incremental review sees a fix, CodeRabbit often marks the thread `✅ Addressed in commit <sha>` and resolves it itself.
- It has hourly review rate limits. When hit, it posts a comment containing `rate limit` with a wait time. It may also post `Review skipped` (draft PR, path filters, auto-review off).
- If the repo has a `.coderabbit.yaml`, read it first: `path_instructions` and `reviews.path_filters` explain what it will flag.

## Instructions

### 1. Identify the PR

```bash
gh pr view --json number,headRefName,headRefOid -q '{number, branch: .headRefName, sha: .headRefOid}'
```

Switch to the PR branch if you're not already on it.

### 2. Loop

Repeat at most `--max-iterations` times.

#### A. Push and make sure a review is running

```bash
git push
sleep 15
HEAD_SHA=$(gh pr view <PR> --json headRefOid -q .headRefOid)
CR_BUCKET=$(gh pr checks <PR> --json name,bucket 2>/dev/null \
  | jq -r '[.[] | select(.name | test("coderabbit"; "i"))][0].bucket // "none"')
```

If `CR_BUCKET` is `none` and there's no CodeRabbit review for `HEAD_SHA` yet (see B), trigger one:

```bash
gh pr comment <PR> --body "@coderabbitai review"
```

Then poll until the status leaves `pending` (`gh pr checks` exits non-zero while checks are pending, so ignore its exit code):

```bash
for i in $(seq 1 60); do
  CR_BUCKET=$(gh pr checks <PR> --json name,bucket 2>/dev/null \
    | jq -r '[.[] | select(.name | test("coderabbit"; "i"))][0].bucket // "none"')
  [ "$CR_BUCKET" != "pending" ] && [ "$CR_BUCKET" != "none" ] && break
  sleep 10
done
```

While polling, also check the newest CodeRabbit issue comment every few rounds:

```bash
gh api --paginate "repos/{owner}/{repo}/issues/<PR>/comments?per_page=100" \
  | jq -s 'add | map(select(.user.login | test("coderabbit"; "i"))) | sort_by(.updated_at) | last | {updated_at, body}'
```

- Body mentions **rate limit**: stop the loop and report the wait time it gives. Don't spam re-triggers.
- Body says **Review skipped** or **Reviews paused**: comment `@coderabbitai review` (or `@coderabbitai resume`) once, then keep polling.

If ~10 minutes pass with no result, stop and report the timeout. Don't continue on stale results.

#### B. Fetch the review for the head commit

```bash
gh api --paginate "repos/{owner}/{repo}/pulls/<PR>/reviews?per_page=100" \
  | jq -s --arg sha "$HEAD_SHA" 'add
    | map(select((.user.login | test("coderabbit"; "i")) and .commit_id == $sha))
    | last | {id, body}'
```

From the body, parse:

- `Actionable comments posted: N`
- the **Outside diff range** section (actionable, no thread)
- the **Nitpick** section (optional)

If CodeRabbit posted no review for `HEAD_SHA` but its status passed, it found nothing new. Treat that as 0 actionable.

Fetch unresolved CodeRabbit threads (paginate; see [GraphQL reference](references/graphql-queries.md)) and keep those where `isResolved == false` and the first comment's author matches `coderabbit`.

#### C. Exit check

Stop when **both** hold:

- the head-commit review has **0 actionable comments** and no outside-diff findings
- there are **0 unresolved CodeRabbit threads**

Nitpicks don't block the exit. Fix the cheap ones and skip the rest.

Also stop at `--max-iterations`, on a rate limit, or on a timeout.

#### D. Fix

For each unresolved thread and each outside-diff finding:

1. Read the file and the comment in context. Expand `🤖 Prompt for AI Agents` if it's there.
2. If it's a real issue, fix it.
3. If it's wrong or doesn't apply, reply on the thread with a one-line reason. CodeRabbit may save the reply as a learning, which stops it from raising the same point next time:
   ```bash
   gh api "repos/{owner}/{repo}/pulls/<PR>/comments/<COMMENT_ID>/replies" -f body="<reason>"
   ```

#### E. Resolve threads

Resolve the threads you fixed or answered with the batched `resolveReviewThread` mutation from the [GraphQL reference](references/graphql-queries.md). CodeRabbit may auto-resolve fixed threads on its next pass anyway, and resolving early is harmless.

Don't use `@coderabbitai resolve` because it resolves **every** CodeRabbit thread, including ones you haven't looked at.

#### F. Commit and go again

```bash
git add -A
git commit -m "Address CodeRabbit review feedback (iteration N)"
```

Back to **A**.

### 3. Report

```
CodeRabbit loop complete.
  PR:           #123
  Iterations:   2
  Actionable:   0
  Resolved:     7 threads
  Replied:      1 (false positive)
  Nitpicks:     3 skipped
```

If it stopped early, say why (max iterations, rate limit, timeout) and list what's left:

```
CodeRabbit loop stopped after 10 iterations (--max-iterations 10).
  Actionable:   2
  Unresolved:   2

Remaining:
  - src/auth.ts:45 — "Consider rate limiting this endpoint"
  - src/db.ts:112 — "Missing index on user_id column"
```
