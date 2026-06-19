# Fork Sync Guide

This repo tracks two remotes:

| Remote   | URL                                  | Purpose                          |
| -------- | ------------------------------------ | -------------------------------- |
| `novu`   | `https://github.com/novuhq/novu.git` | Upstream public repo (read-only) |
| `origin` | `git@github.com:quanglv34/novu.git`  | Your private fork (SSH)          |

## One-time setup

If the remotes are missing on a fresh clone, add them:

```bash
git remote add novu   https://github.com/novuhq/novu.git
git remote add origin git@github.com:quanglv34/novu.git
```

`origin` uses SSH, so make sure your SSH key is added to GitHub. Verify with:

```bash
ssh -T git@github.com
# Expect: "Hi quanglv34! You've successfully authenticated..."
```

> Note: `novu` is HTTPS and fetch-only. Pushing to it over HTTPS will fail in
> this environment (no credential helper) — that's expected, you should never
> push to upstream anyway.

## Keep your private fork's `next` in sync with upstream

Run this whenever you want to pull the latest upstream changes into your fork:

```bash
# 1. Fetch the latest upstream next
git fetch novu next

# 2. Push upstream next straight to your fork's next
git push origin novu/next:next
```

This mirrors `novu/next` into `origin/next` without touching your local
working branch.

## Check sync status

```bash
# Refresh local view of the fork
git fetch origin next

# Count divergence: "<behind>  <ahead>"  (0  0 means fully in sync)
git rev-list --left-right --count novu/next...origin/next
```

`0	0` means `origin/next` and `novu/next` point at the same commit.

> Tip: always `git fetch` before comparing — a stale local ref can make the
> fork look hundreds of commits behind when it is actually up to date.

## Working on a feature branch

Your feature work lives on its own branch (e.g. `feat/zalo-viettel-providers`).

```bash
# Push your feature branch to the private fork
git push origin feat/zalo-viettel-providers

# Keep your feature branch current with upstream
git fetch novu next
git rebase novu/next        # or: git merge novu/next
```
