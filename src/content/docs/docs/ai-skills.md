---
title: Use AI skills
description: Give Claude Code or Codex a workflow to set up decisio, write a decision request, or add it to your backend.
---

Install three focused skills for your coding assistant, then ask it to run decisio, write a question or connect a decision to your application.
From your application's root directory, use a POSIX terminal with Node 22.12 or later, curl and Python 3:

::site-block{name="skills-download"}

The download goes into your local cache; the installer below copies the selected skill folders into your project.
Keep this terminal open so `DECISIO_PROJECT` and `DECISIO_SKILLS` remain set.
For a browser download, extract the ZIP with your archive tool and use the [manual installation](#manual-installation) below.

::skills-package

## 1. Install for your coding assistant

Choose the tool you use in this application.
Project scope keeps these instructions with this repository.

:::tabs

::tab{label="Codex"}

::site-block{name="skills-codex"}

This installs into `.agents/skills/` in your application.
In Codex CLI or the IDE extension, run `/skills` or type `$` to find a skill.

::tab{label="Claude Code"}

::site-block{name="skills-claude"}

This installs into `.claude/skills/` in your application.
In Claude Code, open `/skills` or type `/decisio-request` to invoke that workflow.

:::

The installer reports each skill's destination and whether it was installed or already present.
If a skill does not appear, start a fresh session in the application.

### Install only one skill

Add `--skill` for a single workflow:

::site-block{name="skills-select"}

Use `--host claude` for Claude Code.

### Use the skills across your projects

Choose personal scope explicitly:

::site-block{name="skills-personal"}

For Codex this writes to `$HOME/.agents/skills`; with `--host claude`, it writes to `$HOME/.claude/skills`.
Choose one scope for each host so duplicate names do not compete.

## 2. Pick the workflow

| Skill | Ask for | Result |
| --- | --- | --- |
| `decisio-setup` | GPU, MLX or Ollama setup, or connection to an existing endpoint | Endpoint configuration, a first request, and a report of what actually ran |
| `decisio-request` | A choice, yes/no question or score rubric | Complete request JSON, a small caller and a response-reading example |
| `decisio-integrate` | A decision inside an existing backend | An application change with timeout handling, errors and a review path |

In Codex, mention `$decisio-setup`, `$decisio-request` or `$decisio-integrate`.
In Claude Code, use `/decisio-setup`, `/decisio-request` or `/decisio-integrate`.
Ordinary language can also select a matching workflow.

Try one of these prompts, including the endpoint or hardware you want to use:

- **Set up:** “Use decisio-setup to connect this project to the decisio endpoint in its environment configuration. Check it and send a first request.”
- **Write a request:** “Use decisio-request to route support tickets to billing, access or other. Save the request and explain how my code reads the answer.”
- **Integrate:** “Use decisio-integrate to add this decision to my Python backend. Send uncertified answers and service failures to review, and require a gold certificate before automatic routing.”

The request workflow can prepare files before you have a server.
A successful service check requires a response from your actual endpoint; follow the reported setup steps when the endpoint is not ready.

## 3. Update or remove

To take a newer compatible package, download and extract that release, then run its installer with `--update` for your original host and scope.
For this package and the Codex project installation above:

::site-block{name="skills-update"}

For Claude Code, use `--host claude`; for a personal installation, use `--scope user`.
In a new terminal, set `DECISIO_PROJECT` to your application path and `DECISIO_SKILLS` to the download directory first.

The installer refuses to overwrite locally edited managed files; preserve your edits before updating.
Extra notes and other skills remain in place.

To uninstall, use the same host, scope and project you installed into:

:::tabs

::tab{label="Codex"}

::site-block{name="skills-uninstall-codex"}

::tab{label="Claude Code"}

::site-block{name="skills-uninstall-claude"}

:::

Uninstall removes only the files recorded by this installer.
For a personal installation, replace `--scope project --project "$DECISIO_PROJECT"` with `--scope user`.

## Manual installation

Extract the ZIP and copy the desired folders from its `skills/` directory, including their `references`, `assets` and metadata.

| Host | Project destination | Personal destination |
| --- | --- | --- |
| Codex | `.agents/skills/<skill-name>/` | `$HOME/.agents/skills/<skill-name>/` |
| Claude Code | `.claude/skills/<skill-name>/` | `$HOME/.claude/skills/<skill-name>/` |

Each destination must contain `SKILL.md` directly, such as `.agents/skills/decisio-request/SKILL.md`.
Copy each self-contained folder once; manage updates and removal of manually copied folders yourself.
The Node commands can be run from a Windows terminal with the extracted installer path and application path quoted explicitly.

## Troubleshoot

| What you see | What to do |
| --- | --- |
| No skills in the selector | Check the destination and `SKILL.md`, open the application in the intended repository, then start a fresh session |
| The assistant chooses another workflow | Invoke the skill by its exact name and state the decisio task you want |
| Duplicate skill names | Keep one installation scope per host and remove the other managed installation |
| An existing folder is not managed | Preserve it, then choose manual installation or resolve the name collision before running the installer again |
| An update is refused | Preserve your edited managed files before updating; ordinary extra notes can stay |
| The package checksum does not match | Download the ZIP again from the linked release before extracting it |
| A request was prepared but not sent | Supply an endpoint or follow [Get started](/docs/) to run one |

## Good to know

The skills guide your coding assistant through your backend workflow.
Run the decision service on the [GPU, MLX or Ollama path](/docs/#1-pick-your-machine) suited to your hardware, and keep its version aligned with the package references.
These folder instructions apply to local Codex and Claude Code discovery; see the [Codex host guide](https://learn.chatgpt.com/docs/build-skills) and [Claude Code host guide](https://code.claude.com/docs/en/skills) for their other distribution options.

## What next

- [Build a request](/docs/build-request/): the fields the assistant will write.
- [Use the probabilities](/docs/concepts/probabilities/): connect a result to application policy.
- [Support routing](/docs/use-cases/support-routing/): a complete backend example with review handling.
