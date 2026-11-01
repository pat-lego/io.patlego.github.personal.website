// Blog section links: every <h2> inside <main> on a blog post gets a link icon.
// Clicking it copies https://.../post.html#section-id and updates the address bar.
// Give an <h2> an explicit id="..." for a stable URL; headings without one get an id generated from their text.
// Loaded only by src/blogs/_post-template.html. Tailwind scans this file (tailwind.config.js), so the
// utility classes used below are kept in the CSS build.
document.addEventListener('DOMContentLoaded', () => {
    const slugify = (text) => text.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    document.querySelectorAll('main h2').forEach((heading) => {
        const title = heading.textContent.trim();
        if (!heading.id) {
            let id = slugify(title) || 'section';
            let n = 2;
            while (document.getElementById(id)) {
                id = `${slugify(title)}-${n++}`;
            }
            heading.id = id;
        }
        heading.classList.add('group', 'scroll-mt-4');

        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.className = 'section-link ml-2 text-base align-middle text-gray-400 hover:text-blue-500 opacity-50 group-hover:opacity-100 focus:opacity-100';
        link.title = 'Copy link to this section';
        link.setAttribute('aria-label', `Copy link to section: ${title}`);
        link.innerHTML = '<i class="fas fa-link"></i>';
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const url = `${location.origin}${location.pathname}#${heading.id}`;
            history.replaceState(null, '', `#${heading.id}`);
            heading.scrollIntoView({ behavior: 'smooth' });
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    link.innerHTML = '<i class="fas fa-check"></i>';
                    link.title = 'Link copied';
                    setTimeout(() => {
                        link.innerHTML = '<i class="fas fa-link"></i>';
                        link.title = 'Copy link to this section';
                    }, 1500);
                }).catch(() => {});
            }
        });
        heading.appendChild(link);
    });
    // Jump to the #fragment ourselves: generated ids did not exist when the browser tried, and on a cold
    // cache the page is still changing height (CSS, icon fonts) when it does. Jump now, and again once
    // everything has loaded, unless the reader has started scrolling in the meantime.
    if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) {
            let userScrolled = false;
            const markScrolled = () => { userScrolled = true; };
            ['wheel', 'touchmove', 'keydown'].forEach((type) => window.addEventListener(type, markScrolled, { once: true, passive: true }));
            target.scrollIntoView();
            const settle = () => {
                if (!userScrolled) {
                    target.scrollIntoView();
                }
            };
            if (document.readyState === 'complete') {
                settle();
            } else {
                window.addEventListener('load', settle, { once: true });
            }
            if (document.fonts) {
                document.fonts.ready.then(settle);
            }
        }
    }
});
