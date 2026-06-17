#!/bin/bash
set -e

# Post-merge setup for GTS Empire (static React/TS/Rsbuild SPA).
# Idempotent and non-interactive. No database migrations are required.
npm install --no-audit --no-fund
