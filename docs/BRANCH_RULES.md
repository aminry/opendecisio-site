# Rules for main

Every pull request branches from `main` and targets `main`; no pull request is stacked on another.

`.github/rulesets/main.json` is the ruleset that enforces the rest, in GitHub's own format.

## What it requires

- No direct push: every change reaches `main` through a pull request, merged by squash only.
- The CI jobs pass on the pull request's latest commit, which must be up to date with `main`: `changes`, `build`, `browsers (chromium, 1/2)`, `browsers (chromium, 2/2)`, `lighthouse-and-links` and `verify-examples`, each from GitHub Actions (app id 15368), so no other app can report them.
  `verify-examples` runs only when a pull request touches what the published commands depend on; a skipped job counts as passed.
  WebKit and Firefox run nightly and on demand, not on every pull request.
- Signed commits: the site's commits are SSH-signed, and GitHub signs squash merges and the bump workflow's API commits.
- Linear history, no force pushes, no deleting `main`.
- Conversations resolved before merging; a review approval is not required, so a one-maintainer repository can still merge.
- No bypass: an administrator meets the same checks.

## The bump workflow under the ruleset

The bump workflow opens its pull request with the workflow's token, which starts no `pull_request` run; it then starts `ci` on the branch with `workflow_dispatch`, and those runs report the checks on the branch's head commit, which is what the ruleset reads.
A bump whose command check failed opens its pull request anyway, and its `build` check fails, so it cannot merge until the record is fixed.
The repository's Actions settings must let the workflow's token write and create pull requests.

## Applying it

With an account that administers the repository, from the repository root:

```
gh api -X POST repos/aminry/opendecisio-site/rulesets --input .github/rulesets/main.json
```

Or by hand: Settings, Rules, Rulesets, New ruleset, New branch ruleset, with the settings listed above; target "Default branch"; enforcement "Active"; no bypass list.

Check it: `gh api repos/aminry/opendecisio-site/rulesets` lists "main", and a pull request with a failing check shows "Merging is blocked".
After a job is renamed in `.github/workflows/ci.yml`, change its name here and in the ruleset in the same pull request, or every pull request waits on a check that never reports.
