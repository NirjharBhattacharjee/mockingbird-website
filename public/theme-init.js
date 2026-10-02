// Runs before first paint (loaded without defer) so the saved flavor and the
// pixel grid size are in place before anything renders. Keep it tiny.
;(function () {
  var root = document.documentElement
  root.classList.add('js')
  try {
    var flavor = localStorage.getItem('mb-flavor')
    if (['mocha', 'macchiato', 'frappe', 'latte'].indexOf(flavor) >= 0) root.dataset.flavor = flavor
  } catch (e) {}
  // Same formula as cellSize() in app/actions/public/lib/pixel-field.ts:
  // the "mockingbird" wordmark is 82 cells wide, plus 4 cells of margin.
  var vw = Math.min(window.innerWidth, 1280)
  var px = Math.max(4, Math.min(10, Math.floor((vw - 40) / 86)))
  root.style.setProperty('--px', px + 'px')
})()
