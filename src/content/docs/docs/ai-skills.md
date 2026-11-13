---
title: Use AI skills
description: Set up decisio, write requests and integrate decisions with skills for Claude Code, Codex, Devin, Cursor and GitHub Copilot.
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

### Devin, Cursor and GitHub Copilot

These tools also read project skills from `.agents/skills/`.
Choose the **Codex** tab above and run its project installation command; `--host codex` selects that shared folder layout.
Keep each complete skill folder, including its references and assets.

| Tool | How to use an installed skill |
| --- | --- |
| [Devin](https://docs.devin.ai/product-guides/skills) | Commit the folders in a connected repository, then include `@skills:decisio-request` in your session prompt |
| [Cursor](https://cursor.com/docs/skills) | Open the project, type `/` in Agent chat and select `decisio-request` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills) | Run `/skills reload`, then include `/decisio-request` in your prompt |

For Devin and other cloud sessions, the skill folders must be available in the repository the session clones.
Local personal installations are separate; they do not automatically reach a remote environment.
For Copilot in an IDE or the cloud, use a [supported agent surface](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) and ask it to use the skill by name.

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

### Example: connect to your server

Use **decisio-setup** when your backend needs a working connection.
For a decisio server already running locally, paste:

> Use decisio-setup to connect this application to http://localhost:8000. Save the endpoint in the project's existing environment configuration, check the service and send one support-ticket request.

You should get reusable endpoint configuration, a first response and the command to check the connection again.
The assistant reports any missing requirement if the endpoint is unavailable.

For a fresh installation, replace the endpoint sentence with “Set up decisio with MLX,” “Use my NVIDIA GPU,” or “Use Ollama with the decisio model listing.”
Run the setup in an environment with access to that hardware or endpoint.

### Example: write a ticket-routing request

Use **decisio-request** when you know the decision you want to ask.
Paste:

> Use decisio-request to route support tickets to billing, access or other, using the endpoint configured in this project. Start with “I was charged twice this month” and save request.json plus a small Python caller. Show how to read the chosen category and its probabilities.

You should get a named choice question with the three options, the input ticket in `state`, and a caller that reads the answer.
The model chooses the category when you run it; the prompt does not fix the result.
Without an endpoint, the assistant can still prepare the files and explain how to run them later.

### Example: add the decision to your backend

Use **decisio-integrate** once your application needs to act on the answer.
Paste:

> Use decisio-integrate to add ticket routing to this Python backend using its HTTP client and configured decisio endpoint. Set a three-second timeout and send service errors or uncertified answers to review. Require a gold certificate before automatic assignment, and add tests for successful routing, review and timeout.

You should get a small application change with configuration, response handling and tests that follow your existing project structure.
Automatic assignment requires an answer with `certified: true` and `certificate_kind: "gold"`; the other cases follow the review path.
See [Support routing](/docs/use-cases/support-routing/) for the full application example.

Use the same prompts in each assistant, with its invocation from the table above.
For example, a Devin request can start with `@skills:decisio-request`, while Codex can start with `$decisio-request` and Claude Code, Cursor or Copilot CLI with `/decisio-request`.

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

The package installer manages the Codex and Claude Code folder layouts; Devin, Cursor and Copilot can read the shared project layout described above.
Their discovery instructions come from their linked host guides; this package has been exercised with Codex and Claude Code.
See the [Codex host guide](https://learn.chatgpt.com/docs/build-skills) and [Claude Code host guide](https://code.claude.com/docs/en/skills) for other distribution options.

## What next

- [Build a request](/docs/build-request/): the fields the assistant will write.
- [Use the probabilities](/docs/concepts/probabilities/): connect a result to application policy.
- [Support routing](/docs/use-cases/support-routing/): a complete backend example with review handling.
