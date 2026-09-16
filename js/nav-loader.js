(() => {
  const commonHeadMarkup = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <link class="favicon-node" rel="icon" type="image/png" href="asset/taxpower_icon.png">
    <meta name="author" content="TaxPower">
  `;

  function appendCommonHead() {
    const template = document.createElement('template');
    template.innerHTML = commonHeadMarkup.trim();
    document.head.appendChild(template.content.cloneNode(true));
  }

  async function loadSharedNavigation() {
    const slot = document.querySelector('[data-nav-slot]');
    if (!slot) return;

    try {
      const response = await fetch('nav.html', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Unable to load nav.html: ${response.status}`);
      }

      const html = await response.text();
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      slot.replaceWith(template.content.cloneNode(true));
      window.taxPowerNavigationLoaded = true;
      document.dispatchEvent(new CustomEvent('taxpower:navigation-loaded'));
    } catch (error) {
      console.error(error);
      slot.innerHTML = '<p class="nav-load-error">Navigation could not be loaded.</p>';
    }
  }

  appendCommonHead();
  loadSharedNavigation();
})();
