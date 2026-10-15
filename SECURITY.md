# Security

Please report a security problem in this website privately, through GitHub's private vulnerability reporting: the repository's Security tab, "Report a vulnerability".
Do not open a public issue for it.

A problem in decisio itself belongs to [the decisio repository](https://github.com/aminry/decisio), through its own Security tab.

The site is static: it has no server code, no accounts and no forms, and it sets no cookies of its own (see `/privacy/`).
Its pages are served with a strict Content-Security-Policy, HSTS and the other headers in `scripts/headers.mjs`.
