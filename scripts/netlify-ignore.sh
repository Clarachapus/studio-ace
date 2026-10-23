#!/bin/bash
# Netlify "ignore" step: exit 0 skips the build, exit 1 builds.
# The editor saves every photo as its own commit, then the page text in a last one.
# Building only when something other than photos changed publishes the whole save
# once, instead of once per photo: the free plan counts every deploy.
if [ -z "$CACHED_COMMIT_REF" ] || [ "$CACHED_COMMIT_REF" = "$COMMIT_REF" ]; then exit 1; fi
if ! git cat-file -e "$CACHED_COMMIT_REF^{commit}" 2>/dev/null; then exit 1; fi
if git diff --quiet "$CACHED_COMMIT_REF" "$COMMIT_REF" -- . ':(exclude)public/media'; then
  echo "Only photos changed since the last deploy: build skipped, they go live with the next save."
  exit 0
fi
exit 1
