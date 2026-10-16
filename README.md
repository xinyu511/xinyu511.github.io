# xinyu511.github.io

Personal site of Xinyu Li, served by GitHub Pages from `main`.

Plain HTML/CSS/JS with no build step. Preview locally:

```bash
python3 -m http.server 8511
```

- `index.html`: homepage (hero stack figure, selected work, about)
- `projects/`: one page per project write-up
- `assets/site.css`: all styles; color tokens at the top, dark mode included
- `assets/stack.js`: draws the hero stack figure from the layer list in `index.html` and runs the work filters
- `_build/build.py`: the project list. Edit it, then run `python3 _build/build.py` to regenerate `projects/*.html` and the homepage work list
- `assets/chart-data.js`: data behind every chart, with its source noted; `assets/charts.js` draws it (full charts and homepage thumbnails)
- `assets/logos/`: school and company marks for the timeline
