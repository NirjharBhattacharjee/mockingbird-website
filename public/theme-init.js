// Runs before first paint (loaded without defer) so the saved flavor and the
// pixel grid size are in place before anything renders. Keep it tiny.
;(function () {
  var root = document.documentElement
  root.classList.add('js')
  try {
    var flavor = localStorage.getItem('mb-flavor')
    var flavors = ['mocha', 'macchiato', 'frappe', 'latte']
    // Seasonal: same cut-off as FLAVORS in app/actions/public/flavor-button.tsx
    if (new Date() < new Date(2026, 10, 1)) flavors.push('halloween')
    if (flavors.indexOf(flavor) >= 0) root.dataset.flavor = flavor
  } catch (e) {}
  // Same formula as cellSize() in app/actions/public/lib/pixel-field.ts:
  // the "mockingbird" wordmark is 82 cells wide, plus 4 cells of margin.
  var vw = Math.min(window.innerWidth, 1280)
  var px = Math.max(4, Math.min(10, Math.floor((vw - 40) / 86)))
  root.style.setProperty('--px', px + 'px')
  // The wordmark's own cells, as wordCellSize() in pixel-field.ts.
  var wpx = Math.max(4, Math.floor((Math.min(window.innerWidth, 1600) * 0.88) / 82))
  root.style.setProperty('--wpx', wpx + 'px')
})()
