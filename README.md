# Yao Yao · Academic homepage

Static, responsive English academic homepage for GitHub Pages. `index.html` is the landing page and `cv.html` is a printable CV; visitors can use **Print / Save PDF** from the CV page.

The site uses the supplied English CV and portrait. Publication links to ACL Anthology, OpenReview, and code were checked where available. EMNLP 2026 details are attributed to the supplied CV until official proceedings pages are available. Dynamic citation counts are deliberately omitted.

## Publish on GitHub Pages

In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, then choose `main` and `/(root)`. The site URL will be <https://zoeyyao27.github.io/> after deployment finishes.

No build step or package installation is required.

## GIMFlow conference listening pages

The four temporary listening pages are available directly for QR codes:

- <https://zoeyyao27.github.io/standalone_bookmarks/anxiety.html>
- <https://zoeyyao27.github.io/standalone_bookmarks/loneliness.html>
- <https://zoeyyao27.github.io/standalone_bookmarks/low-mood.html>
- <https://zoeyyao27.github.io/standalone_bookmarks/overload.html>

Each page defaults to English, offers a Chinese toggle, and loads its matching MP3 from the same folder. Visitors tap **Enter the experience** once to start the music; browsers generally block audible autoplay before a user gesture. Playback continues while they scroll, with compact pause, progress, and volume controls. The shared `listening.css` and `listening.js` power the design and controls. Pastel color layers and small floating decorations are CSS-only and become static when reduced motion is preferred. Every page includes a short reflection, three practical steps, and a link back to the homepage. The homepage links to all four from the GIMFlow conference card. After EMNLP, remove that link group and the `standalone_bookmarks/` folder in a new commit to retire the pages and audio. Existing QR codes will then lead to a 404 page; removal is not automatic.
