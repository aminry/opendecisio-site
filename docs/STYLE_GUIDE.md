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
- **Plain words.** "Confidence you can trust", not "calibration"; "the text", not "the state"; "the answers it can stand behind", not "coverage".
- **A small glossary** for the words that must stay (below), linked on first use on a page.
- **Second person, present tense.** "You send a request", not "a request is sent".
- **Code a reader can paste.** Every command and request runs as shown, and CI checks it (verify-examples).
- **No dashes as punctuation**; commas, colons and full stops.

### The glossary

| Word | Plain meaning |
| --- | --- |
| question | what you ask about a text, with its options |
| option | one possible answer to a question |
| confidence | the probability decisio gives an option; it means what it says |
| task | a question you ask again and again, taught from your labelled examples |
| certified answer | an answer decisio stands behind at the error rate you chose |
| threshold | the confidence above which answers are certified |
| drift | traffic moving away from the examples a task was certified on |
| base | the model decisio serves (Gemma 4 31B by default) |
| abstain | decisio declines to answer when no option is likely enough |

## Numbers

- Every number traces to a record: the site's data files (launch facts, the demos' data) or decisio's text at the pinned release.
- The build checks that a number still matches its source; a page never types a measured number by hand.
- Each figure appears once per page (the content check); a figure on a chart may repeat a table's.
- A number carries its conditions beside it once: the model, the card or Mac, the date.

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
> Pick an error rate, say 5%. Of the answers decisio certifies, at most 5% are wrong, for traffic like your examples (with 90% confidence).
> A stricter rate certifies fewer answers; the rest go to a person.

**5. The first request** (Your first decision).

Before:
> A decision is a text and typed questions about it.
> You send them in one request; the server reads the text once and answers every question: a probability for every option.

After:
> Send a text and a question with its options. Get back a confidence for every option, in one call.

## How the rules are checked

- Existing checks stay: one figure per page, no ranks or comparisons, at most three sentences per paragraph, every command verified, nothing internal on any page.
- New checks: no link from a docs page to decisio's docs on GitHub; every page opens with a paragraph and then a code block or figure; every animated figure has a pause control, a reduced-motion frame and alt text.
