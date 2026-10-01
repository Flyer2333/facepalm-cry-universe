(() => {
  const dialog = document.getElementById('entrance');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!dialog || reduced.matches || location.hash || typeof dialog.showModal !== 'function') return;
  const faces = document.getElementById('entry-faces');
  for (let i = 0; i < 18; i++) {
    const angle = i / 18 * Math.PI * 2;
    const face = document.createElement('img');
    face.src = 'assets/favicon.png'; face.alt = ''; face.width = 64; face.height = 64;
    face.style.setProperty('--x', `${Math.cos(angle) * (i % 2 ? 275 : 210)}px`);
    face.style.setProperty('--y', `${Math.sin(angle) * (i % 2 ? 190 : 145)}px`);
    face.style.setProperty('--angle', `${i * 20}deg`);
    face.style.setProperty('--delay', `${i * 22}ms`);
    faces.append(face);
  }
  let exiting = false, timer;
  const finish = () => {
    if (exiting) return;
    exiting = true; clearTimeout(timer);
    dialog.classList.add('leaving'); document.body.classList.remove('entering');
    document.body.classList.add('arrived');
    setTimeout(() => { dialog.close(); document.body.classList.remove('arrived'); }, 520);
  };
  document.getElementById('skip-entry').addEventListener('click', finish);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  reduced.addEventListener('change', () => { if (reduced.matches) finish(); });
  try {
    dialog.showModal(); document.body.classList.add('entering');
    timer = setTimeout(finish, 2350);
  } catch { dialog.close(); document.body.classList.remove('entering'); }
})();
