#!/bin/bash
set -e

cd "$(dirname "$0")/.."

mkdir -p dist-css

# Run PostCSS (which handles Tailwind + Mantine CSS processing)
bunx postcss src/index.css -o dist-css/index.css
