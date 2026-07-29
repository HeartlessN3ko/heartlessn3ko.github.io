(() => {
  const root = document.documentElement;
  const saved = localStorage.getItem('lifeofskye-theme');
  if (saved === 'day' || saved === 'night') root.dataset.theme = saved;

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const render = () => {
      const isDay = root.dataset.theme === 'day';
      button.querySelector('.theme-icon').textContent = isDay ? '☀' : '☾';
      button.querySelector('.theme-label').textContent = isDay ? 'Day' : 'Night';
      button.setAttribute('aria-label', `Switch to ${isDay ? 'night' : 'day'} theme`);
    };
    render();
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'day' ? 'night' : 'day';
      localStorage.setItem('lifeofskye-theme', root.dataset.theme);
      render();
    });
  });

  const header = document.querySelector('.site-header');
  if (header) {
    const masthead = header.querySelector('.masthead');
    if (masthead && !masthead.querySelector('.masthead-mark')) {
      masthead.innerHTML = '<span class="masthead-mark" aria-hidden="true">♥</span>Life of Skye';
      masthead.setAttribute('aria-label', 'Life of Skye home');
    }
    const nav = header.querySelector('nav');
    if (nav && !nav.querySelector('[data-theme-toggle]')) {
      const toggle = document.createElement('button');
      toggle.className = 'theme-toggle';
      toggle.type = 'button';
      toggle.dataset.themeToggle = '';
      toggle.innerHTML = '<span class="theme-icon" aria-hidden="true"></span><span class="theme-label"></span>';
      nav.append(toggle);
      const render = () => {
        const isDay = root.dataset.theme === 'day';
        toggle.querySelector('.theme-icon').textContent = isDay ? '☀' : '☾';
        toggle.querySelector('.theme-label').textContent = isDay ? 'Day' : 'Night';
        toggle.setAttribute('aria-label', `Switch to ${isDay ? 'night' : 'day'} theme`);
      };
      render();
      toggle.addEventListener('click', () => {
        root.dataset.theme = root.dataset.theme === 'day' ? 'night' : 'day';
        localStorage.setItem('lifeofskye-theme', root.dataset.theme);
        render();
      });
    }
  }

  document.querySelectorAll('.article-page').forEach((page) => {
    const articleHeader = page.querySelector(':scope > .article-header');
    const content = page.querySelector(':scope > .article-content');
    if (!articleHeader || !content) return;
    const card = document.createElement('article');
    card.className = 'article-card';
    page.insertBefore(card, articleHeader);
    card.append(articleHeader, content);
    const button = document.createElement('span');
    button.className = 'love-button';
    button.setAttribute('aria-label', 'Love this article');
    button.textContent = '♥ Love this';
    card.append(button);
  });
})();
