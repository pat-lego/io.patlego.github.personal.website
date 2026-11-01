# Personal Website

This is a simple static HTML website (patlego.com) built with plain HTML, [Tailwind CSS](https://tailwindcss.com/),
and [Alpine.js](https://alpinejs.dev/) for the small bits of interactivity (search boxes, mobile
nav, filtering). There's no framework/bundler beyond [Gulp](https://gulpjs.com/), which stitches
HTML partials together and copies the result into `docs/`, which is what GitHub Pages actually
serves.

## Site structure

```
src/
  index.html            # Home page (src/*.html files build straight into docs/)
  about.html
  blogs.html            # Blog index/listing page
  store.html            # Store index/listing page
  partials/
    head.html           # Shared <head> (meta, CSS, Alpine.js script tag)
    header.html         # Site nav (mobile-first: hamburger menu + desktop nav in one markup)
    footer.html
    pages/
      main.html         # Content injected into index.html's <main>
      about.html        # Content injected into about.html's <main>
      blogs.html         # The blog listing UI (search + card grid)
      store.html         # The store listing UI (search + Content/Courses sections)
  blogs/
    blogs.json           # One entry per post: slug, card text, social-preview title/description
    _post-template.html  # The single shared page every post is rendered from (head, meta, header, footer)
    partials/
      <slug>.html        # The actual blog post content
  store/
    <slug>.html          # One full page per product/course (its own <head>/OG tags)
    partials/
      <slug>.html        # The actual product/course detail content
  assets/                 # Images/SVGs, copied as-is into docs/assets
  styles/
    tailwind.css          # Tailwind entrypoint, compiled to docs/css/tailwind.css

docs/                     # BUILD OUTPUT ONLY — never edit by hand, gulp regenerates this
gulpfile.js               # Build tasks (see below)
```

Every page follows the same include pattern (via `gulp-file-include`, prefix `@@`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    @@include('partials/head.html')
    <meta property="og:title" content="..." />
    <meta property="og:url" content="..." />
</head>
<body>
    @@include('partials/header.html')
    <main>
        @@include('partials/pages/whatever.html')
    </main>
    @@include('partials/footer.html')
</body>
</html>
```

### Gulp build tasks (`gulpfile.js`)

- `css` — compiles `src/styles/**/*.css` with PostCSS/Tailwind into `docs/css`.
- `htmlPages` — compiles top-level `src/*.html` (home, about, blogs, store) into `docs/`.
- `htmlBlogs` — renders `src/blogs/_post-template.html` once per entry in `src/blogs/blogs.json` into
  `docs/blogs/<slug>.html`, and fails the build if an entry is invalid or its partial is missing.
- `htmlStore` — compiles `src/store/**/*.html` (including its `partials/`) into `docs/store`.
- `assets` — copies `src/assets/**/*` into `docs/assets`.
- `js` — copies `src/js/**/*.js` into `docs/js`. Shared scripts go here and are loaded with
  `<script src>`, so changing one does not rewrite every generated page.
- `watch` — serves `docs/` with browser-sync and re-runs the tasks above on file changes.

Running `yarn start` (or bare `gulp`) wipes `docs/`, runs all of the above once, then watches for
changes and live-reloads. `yarn build` runs them once without watching. `yarn deploy` builds and
also copies `CNAME` into `docs/` (needed for the custom domain on GitHub Pages).

## How to build / deploy

- `yarn install`
- `yarn deploy`
- `git push origin main`

GitHub Pages serves the `docs/` folder directly from `main` — there is no CI workflow in this repo;
deployment is just "build locally, commit `docs/`, push".

## Adding a new blog post

A blog post needs two things. There is no per-post page to copy: every post is rendered from
`src/blogs/_post-template.html`.

1. **The article** — `src/blogs/partials/<slug>.html`. Just the article markup wrapped in a
   `<section>`, starting with the "← Back to Blogs" link like the existing posts.
2. **An entry in `src/blogs/blogs.json`** — this one entry drives both the card on `/blogs.html` and
   the generated page `docs/blogs/<slug>.html` (canonical URL, `og:*` and `twitter:*` tags):

```json
{
    "slug": "my-new-post",
    "name": "My New Post",
    "summary": "One sentence for the card on /blogs.html.",
    "title": "Optional longer title for social previews (defaults to name)",
    "description": "Optional longer description for social previews (defaults to summary)",
    "image": "/assets/my-image.jpg",
    "imageWidth": 1200,
    "imageHeight": 1200
}
```

- `slug`, `name` and `summary` are required. `slug` is the file name of the partial and the URL
  (`/blogs/<slug>.html`); only `a-z`, `0-9` and `-`.
- `title`, `description`, `image`, `imageWidth`, `imageHeight` are optional. Without `image`, the
  default `/assets/social.png` (1080×1080) is used.
- Entries are shown on `/blogs.html` in file order.
- Values are HTML-escaped by the build, so write them as plain text.

Run `yarn build` (or `yarn start`) and the card and page appear. A missing field, a duplicate slug, or
a slug without a matching partial stops the build with an error naming the entry.

### Linking to a section of a blog post

Every `<h2>` inside `<main>` on a blog post gets a link icon next to it (script
`src/js/blog-section-links.js`, loaded only by `src/blogs/_post-template.html`). Clicking it copies the section URL, e.g.
`https://www.patlego.com/blogs/slow-activation-could-not-obtain-lock.html#how-to-avoid-it`, and opening
that URL jumps straight to the section.

Give section headings an explicit, short `id` so shared links stay valid even if the heading text
changes later:

```html
<h2 id="how-to-avoid-it" class="font-bold text-2xl m-5">How to avoid it</h2>
```

Headings without an `id` still get a link: the script generates one from the heading text
(lowercase, spaces to `-`), but that id changes whenever the text does.

## Adding a new store product or course

Same three-piece pattern as blogs, under `src/store/` instead of `src/blogs/`:

1. **The full page** — `src/store/<slug>.html`, with its own `og:*`/`twitter:*` meta tags
   (including `product:price:amount`/`product:price:currency`) so sharing the product link on
   social media shows that product's own preview, not the generic site card.
2. **The content partial** — `src/store/partials/<slug>.html` with the product/course detail
   layout (image, description, price, buy/curriculum link). Include a "← Back to Store" link like
   the existing entries.

   **Every `type: 'course'` page must include:**
   (see `src/store/partials/intro-to-dev.html` for a working example)
   - **🙋 About the Instructor** — a 2-line summary of the teacher and why they're a good fit to
     teach this course, plus a link to `/resume.html`.
   - **A "Course Details" section with three parts:**
     - **💳 Payment** — the payment/checkout link once you have one; show a "not live yet"
       placeholder until then.
     - **📍 Location** — where it's held; `TBD` is fine as a placeholder.
     - **🎒 What to Bring** — what a student needs to show up with (e.g. a Windows or Mac laptop
       with its power cable, plus anything else required).
3. **A listing entry** — add an object to the `products` array, written directly inline in a
   `<script>` tag (same pattern as the `blogs` array in `src/partials/pages/blogs.html` — no JSON
   file, no fetch, just a plain JS array baked straight into the page). This array currently
   appears in three places and must be kept in sync by hand:
   - `src/partials/pages/store.html` — renders the Content and Courses sections on `/store.html`.
   - `src/store/partials/intro-to-dev.html` — reads its own entry (matched by `slug`) to populate
     its Payment and Location cards.
   - `src/store/partials/basics-of-development.html` — same, for that course.

```html
<script>
    const products = [
        {
            slug: 'advanced-dev-course', type: 'course', name: 'Advanced Dev',
            description: 'A follow-up course to Intro to Dev.',
            price: '$150', image: '/assets/intro-to-dev-cartoon.svg', url: '/store/advanced-dev-course.html',
            buyLabel: 'View Curriculum', paymentUrl: 'https://book.stripe.com/your-link-here',
            location: null, startDate: '2027-01-10', secret: false, preview: false
        }
        // ...existing entries
    ];
</script>
```

- `slug` must match the filename you gave `src/store/<slug>.html`.
- `type: 'content'` items render in the **Content** section (simple list, appears first — no
  particular visual polish needed). `type: 'course'` items render in the **Courses** section
  (card grid, sorted so the item with the soonest `startDate` shows first; items without a
  `startDate` sort last and show "Date TBD").
- If `url` starts with `http`, the card's buy/details link opens in a new tab; otherwise it's
  treated as an on-site page and opens in the same tab.
- `paymentUrl` — the Stripe (or other) checkout link. Set it to `null` to show a "Payment link is
  not live yet" placeholder on the course's Payment card instead of a working button.
- `location` — shown on the course's Location card; set it to `null` to show `TBD` instead.

### `secret` and `preview` flags

Both are optional booleans on a `products` entry:

- `secret: true` — the item is completely filtered out and never rendered. Use this to commit and
  deploy an item to production before you're ready for anyone to see it.
- `preview: true` — the item still renders in its normal spot, but greyed out (grayscale, reduced
  opacity) and non-clickable, with a "Coming Soon" badge. Use this when you want people to see an
  item is on the way without letting them interact with it yet. (Ignored while `secret: true`.)

```html
<script>
    const products = [
        {
            slug: 'advanced-dev-course', type: 'course', name: 'Advanced Dev',
            description: 'A follow-up course to Intro to Dev.',
            price: '$150', image: '/assets/intro-to-dev-cartoon.svg', url: '/store/advanced-dev-course.html',
            buyLabel: 'View Curriculum', paymentUrl: null, location: null, startDate: '2027-01-10',
            secret: true,   // not rendered at all until this is removed/set to false
            preview: true   // ready for when secret flips to false — will show greyed out + "Coming Soon"
        }
    ];
</script>
```

Note: `secret` only hides the item from the rendered page — the object is still present in the
page's plain JS source, so it isn't a true access-control mechanism, just a way to stage content
ahead of launch.
