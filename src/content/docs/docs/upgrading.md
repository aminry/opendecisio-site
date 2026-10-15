---
title: Upgrading
description: What changes for a running deployment from one release to the next, newest first.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The page below is decisio's docs/upgrading.md at the pinned release. -->

The changelog lists every change; this page is for the ones that change what a deployment serves.
Read the entry for each release between yours and the one you are moving to.

::figure{name="upgrade-path"}

## TL;DR

To keep the Qwen base, which the container served before 0.10.0:

::upstream{file="docs/upgrading.md" block="1"}

:::glossary

| Word | Meaning |
| --- | --- |
| default base | the model served when you name none: Gemma 4 31B since 0.10.0 |
| pin | the revision of a model repository that a release serves |
| served name | what `GET /v1/models` lists; it changes with the base |

:::

:::caution[Common mistake]
Tasks fitted on one base are not applied by a server on another.
The server prints `WARNING: tasks fitted under another model or rendering are not applied` at start, and `POST /v1/tasks/import` refuses them: register them again from their examples.
:::

## The releases

::upstream{file="docs/upgrading.md"}

## What next

- [Releases](/docs/releases/): the changelog, every change.
- [Deploying and operating](/docs/operating/): keeping a server up across an upgrade.
- [Choosing a base](/docs/bases/): what changes when the default base does.
