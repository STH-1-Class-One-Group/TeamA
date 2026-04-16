# JamIssue Agent Instructions

These rules are top-level repository instructions for maintenance and refactoring work.

## Refactoring Scope

1. Refactoring must only change structure, responsibility boundaries, naming safety, dependency flow, or test coverage.
2. Do not change user-facing copy, wording, tone, punctuation, spacing style, or text nuances unless the user explicitly asks for it.
3. String edits are allowed only when they fix:
   - broken encoding
   - a functional bug
   - an objectively incorrect label or message required by the task
4. Do not make cosmetic text cleanups such as:
   - removing or adding periods
   - rephrasing sentences
   - renaming text for style consistency only
   - rewriting test fixture strings without task-specific need
5. When refactoring, preserve existing product behavior and existing copy by default.

## Working Style

1. Prefer small, isolated branches from the latest `main`.
2. Keep one coherent refactoring theme per branch.
3. Run validation after each substantial refactoring slice.
4. If a change is only aesthetic and not required for the task, do not include it.

## GitHub Publish Workflow

1. Use the proven no-UI publish path only:
   - create `.tmp-gcm-input.txt` with:
     - `@("protocol=https","host=github.com","") | Set-Content -Path .tmp-gcm-input.txt`
   - read the cached credential with:
     - `cmd /c "git credential-manager get < .tmp-gcm-input.txt"`
   - extract the `password=` value as the GitHub token
   - push with Git HTTPS using:
     - `git -c http.sslBackend=openssl -c credential.helper= push "https://oauth2:$token@github.com/<owner>/<repo>.git" HEAD:refs/heads/<branch>`
   - create PR, poll checks, and merge with GitHub REST using that same token
2. Do not switch publish methods mid-task just because one attempt fails.
3. Do not fall back to:
   - GitHub app blob/tree write flows
   - interactive `gh auth login`
   - browser/device login prompts
   - ad-hoc alternate connectors
4. Do not use `git credential fill` for this repository publish flow.
5. If the approved no-UI publish path is blocked because `git credential-manager get` does not return a cached token, stop and report that exact blocker instead of experimenting with another publish route.
6. If Git HTTPS fails under the Windows default TLS stack, force `http.sslBackend=openssl` for publish commands.
7. For PR/merge loops, keep the sequence fixed:
   - implement
   - local validation
   - push
   - create PR
   - merge
   - verify `main` checks, deployment, and security/quality state
