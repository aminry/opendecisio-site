# The style guide

How every docs page, and home, Benchmarks and Demos, are written (approved 2026-10-18).
Articles and News stay as published.
The hard rules on numbers, claims, providers and independence are in `CONTENT_RULES.md` and bind alongside this guide.

## Who we write for

A backend engineer putting decisio into production.
They know HTTP, Docker and their own stack; they do not know machine learning.
They come with four questions:

| Question | Where it is answered |
| --- | --- |
| How do I run it? | Get started, then the deploy how-tos |
| How do I call it? | Get started, then "Call it from your code" |
| What can I use it for? | Use cases |
| How do I size and run it in production? | The deploy, scale and operate how-tos, and "Requirements and limits" |

Internals (the readout, the probabilities, repeatability) live on one page: How it works.

## What every page does

1. **Opens with what you will get**, in one or two sentences.
2. **Shows a runnable example next**: a command or a request, with its answer.
3. **Then the details**, in short sections a reader can skip.
4. **Ends with "What next"**: two or three links, all on this site.

## Tone

- **Benefits first.** Say what the reader gets before how it works.
- **Confident and bold, and measured.** Every number is a measurement with its source; nothing is rounded up or implied.
- **No caveats scattered through pages.** A page has at most one "Good fit / Not a good fit" box, where the choice matters.
- **One "Requirements and limits" page** holds the hardware, the context lengths, what was measured on what, and what was not tested.
- **Keep only the caveats that prevent a production failure**, once, written as a setup step:
  - "After upgrading decisio, certify your tasks again."
  - "A certificate covers one task on one serving setup. Certify again when you change either."
- **No comparisons or ranks** against other systems outside Benchmarks, and there only as dated measurements (the existing claims check).

## Writing

- **Short sentences.** One idea per paragraph, at most about three lines.
- **Bullets and tables over prose.** A list of settings is a table; steps are a numbered list.
- **Plain words.** "Probabilities you can trust", not "calibration"; "the text", not "the state"; "the answers it can stand behind", not "coverage".
- **"Probability", never "confidence".** The API has a `confidence` field that is a different number (System One's rescaled score); it appears only on the HTTP API page, in code, with one line saying what it is and that thresholds use the top probability.
- **The certificate's bound is written one way:** "nine times in ten".
- **A small glossary** for the words that must stay (below), linked on first use on a page.
- **Second person, present tense.** "You send a request", not "a request is sent".
- **Code a reader can paste.** Every command and request runs as shown, and CI checks it (verify-examples).
- **No dashes as punctuation**; commas, colons and full stops.

### The glossary

| Word | Plain meaning |
| --- | --- |
| text | what you ask about (the API's `state` field) |
| question | what you ask about a text, with its options |
| option | one possible answer to a question |
| probability | the number decisio gives each option; a question's probabilities add up to 1 |
| top probability | the probability of the likeliest option; certificates and thresholds use it |
| task | a question you ask again and again, taught from your labelled examples |
| error target | the share of certified answers you allow to be wrong |
| certified answer | an answer decisio stands behind at your error target |
| threshold | the top probability above which answers are certified |
| drift | traffic moving away from the examples a task was certified on |
| base | the model decisio serves (Gemma 4 31B by default) |
| abstain | decisio declines to answer when no option is likely enough |
| serving setup | the model, the engine, the GPU and the settings a certificate was made on |

## The latest release only

- The site documents the pinned decisio release: its behaviour, stated plainly, with no "from 0.16.0" and no "before 0.12.0".
- No page describes an older release's behaviour, bugs or fixes, or certificates made on older releases; version history lives on Release notes only, with decisio's upgrade notes and changelog.
- A release is named in a source note, in code (an install command), or on Release notes; the versions check fails any other mention, and lists those in decisio's own included text for decisio to trim.
- "Certify your tasks again after any upgrade" is current advice and stays.

## Numbers

- Every number traces to a record: the site's data files (launch facts, the demos' data) or decisio's text at the pinned release.
- The build checks that a number still matches its source; a page never types a measured number by hand.
- Each figure appears once per page (the content check); a figure on a chart may repeat a table's.
- A measured number carries a short source note in its source line, not in the prose: "Measured on" (or "Recorded on") the release, the card and the date (`::source` on a docs page, class `src-note` elsewhere).
- A recorded output (a decision, a run's table, a certificate) carries one label naming the release, the card and the date it ran on.
- It stays when the pin moves on, unless a later release changed what it shows; that is decided from each release's notes and written in `src/config/recorded-outputs.mjs`, and the recorded-output check enforces both.
- A recording is not made again only to verify the site: it is made again alongside new measurements on a GPU.

## Visuals

- **One diagram per concept**, drawn in SVG: the request flow, one decision and its probabilities, teach then certify then route, the deployment layouts.
- **Motion only where it explains**: the home threshold line, an interactive certify slider. Nothing moves for decoration.
- **Every animation has a reduced-motion fallback** (its final frame) **and alt text** that says what it shows.
- **Light**: no chart library, no web font beyond the site's two, under 30 KB of script per figure.
- Each base keeps its colour; the accent is the site's; ink marks warnings.

## Links

- **Never send a reader off-site for docs content.** Every guide lives on this site.
- **Link to decisio's GitHub only for artifacts that cannot move**: a release, a source file, the licence, an issue.
- The API and configuration reference are rendered on this site from decisio's files at the pinned tag.

## Page shapes

| Kind | Shape |
| --- | --- |
| Get started | what you get, then four numbered steps (install, start, ask, read the answer), each with its command |
| Use case | the problem in one line, a Good fit box, the recipe (examples file, teach, certify, route) with working code, the measured demo as proof, What next |
| How-to | the goal, the steps with commands, how to check it worked, What next |
| Reference | generated from decisio's files at the tag; a short intro and a table of contents |
| How it works | one visual page: the diagrams, short captions, a glossary |

## Before and after, from our own pages

**1. The opening** (Make it fast).

Before:
> Almost all of a request's time is the model reading: the state the first time it sees it, then each question.
> Where the state is read once and every question after it starts from that read, a request is fast; the settings below move the cost between the first read, each further question and throughput.

After:
> Ask many questions about one text and pay for reading the text once.
> Here is a request with ten questions about one document, and how long each part took.

**2. A caveat box** (Mac with MLX).

Before:
> The 31B on a Mac is documented for states up to 16,383 tokens, at 6 bits and at 4, and was measured only on a 64 GB Mac.
> At 32,687 tokens the 6-bit conversion runs, with memory pressure.
> The 4-bit conversion starts on a 48 GB Mac by decisio's memory planner, but no 48 GB Mac was measured.

After, as a setup step:
> **Pick your Mac's model.** 64 GB: the 31B at 6 bits. 48 GB: the 31B at 4 bits. 32 GB: the 12B.
> On the 31B, keep documents to 16,383 tokens or fewer.

The measurement details move to "Requirements and limits".

**3. A wall of requirements** (GPU server).

Before:
> Requirements: Linux, one NVIDIA card (measured on an RTX PRO 6000 Blackwell with 96 GB), a driver that supports CUDA 13.0 (the runtime `uv.lock` pins), Python 3.12 and uv.

After:

| You need | |
| --- | --- |
| A GPU | one NVIDIA card with 96 GB for the default model |
| A driver | one that supports CUDA 13.0 |
| Software | Linux, Python 3.12, uv |

**4. Jargon** (What certified means).

Before:
> It is a rate over many answers: a single certified answer can still be wrong.
> It is not a statement about other traffic, another task or another server.
> And it is not free: the guarantee is paid for in the share of answers that get certified, and with too few examples that share is zero.

After:
> Pick an error target, say 5%. Nine times in ten, at most 5% of the answers decisio certifies are wrong, for traffic like your examples.
> A stricter rate certifies fewer answers; the rest go to a person.

**5. The first request** (Your first decision).

Before:
> A decision is a text and typed questions about it.
> You send them in one request; the server reads the text once and answers every question: a probability for every option.

After:
> Send a text and a question with its options. Get back a probability for every option, in one call.

## How the rules are checked

- Existing checks stay: one figure per page, no ranks or comparisons, at most three sentences per paragraph, every command verified, nothing internal on any page.
- New checks: no link from a docs page to decisio's docs on GitHub; every page opens with a paragraph and then a code block or figure; every animated figure has a pause control, a reduced-motion frame and alt text.
