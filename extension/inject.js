Object.defineProperty(document, 'visibilityState', {
  get: () => 'visible',
  configurable: true
});

Object.defineProperty(document, 'hidden', {
  get: () => false,
  configurable: true
});

const blockVisibilityChange = (event) => {
  event.stopImmediatePropagation();
};

window.addEventListener('visibilitychange', blockVisibilityChange, true);
document.addEventListener('visibilitychange', blockVisibilityChange, true);
document.addEventListener('webkitvisibilitychange', blockVisibilityChange, true);

window.addEventListener('blur', (event) => {
  if (event.target === window || event.target === document) {
    event.stopImmediatePropagation();
  }
}, true);
