#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export XDG_CONFIG_HOME="$HOME/.config/sadu-cloudflare"
export WRANGLER_SEND_METRICS=false
PROJECT="sadu-ui"
ORIGIN="https://${PROJECT}.pages.dev"
WRANGLER="./node_modules/.bin/wrangler"

: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID to your personal Cloudflare account id (see: npm run deploy:whoami)}"

identity="$("$WRANGLER" whoami < /dev/null 2>&1)"
if ! grep -q "$CLOUDFLARE_ACCOUNT_ID" <<<"$identity"; then
  echo "Refusing to deploy: account $CLOUDFLARE_ACCOUNT_ID is not available to the login in $XDG_CONFIG_HOME." >&2
  exit 1
fi
if grep -qi "@sarj.ai" <<<"$identity"; then
  echo "Refusing to deploy: the login in $XDG_CONFIG_HOME is a sarj.ai account, not your personal one." >&2
  exit 1
fi

SADU_REGISTRY_URL="$ORIGIN/r" VITE_SADU_PUBLIC_ORIGIN="$ORIGIN" npm run build < /dev/null

"$WRANGLER" pages deploy dist --project-name "$PROJECT" --branch main --commit-dirty=true < /dev/null
