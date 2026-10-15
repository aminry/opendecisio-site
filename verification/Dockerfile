# A clean Linux machine for scripts/verify-commands.mjs, for when the host's
# port 8000 is taken or the host is not Linux. CI runs the same script on its
# own runner without this image.
FROM node:22-bookworm-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends git curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /uvx /usr/local/bin/
WORKDIR /site
