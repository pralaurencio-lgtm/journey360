// ============================================================
// router.js — minimal hash router.  #view or #view/param
// ============================================================

let renderCb = () => {};

export function mount(cb) {
  renderCb = cb;
  window.addEventListener('hashchange', renderCb);
}
export function go(view, param) {
  const next = param != null ? `#${view}/${encodeURIComponent(param)}` : `#${view}`;
  if (location.hash === next) renderCb(); // same route -> force refresh
  else location.hash = next;
}
export function refresh() { renderCb(); }
export function route() {
  const h = (location.hash.slice(1) || 'home');
  const [view, param] = h.split('/');
  return { view, param: param ? decodeURIComponent(param) : null };
}
