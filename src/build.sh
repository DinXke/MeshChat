#!/usr/bin/env bash
# Bouwt ../meshchat.html (+ ../sw.js en ../manifest.webmanifest) uit de losse delen in deze map.
# Gebruik: bash build.sh
set -e
cd "$(dirname "$0")"
cat core.js core2.js app1.js app2.js app3.js app4.js > .all.js
node --check .all.js
{
  # <head> + CSS uit het ontwerp; titel hernoemen en de PWA/meta-regels uit head-extra.html erachter
  sed -n '1,311p' design.html | sed 's#<title>MeshCore IRC</title>#<title>MeshChat</title>#' | sed '/<title>MeshChat<\/title>/r head-extra.html'
  cat extra.css
  echo '</style>'
  echo '</head>'
  cat body.html
  echo '<script>'
  cat .all.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > ../meshchat.html
rm -f .all.js
cp sw.js ../sw.js
cp manifest.json ../manifest.webmanifest
echo "meshchat.html: $(wc -c < ../meshchat.html) bytes (+ sw.js, manifest.webmanifest)"
