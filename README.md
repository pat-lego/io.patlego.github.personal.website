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
    <slug>.html          # One full page per blog post (its own <head>/OG tags)
    partials/
      <slug>.html        # The actual blog post content, included by blogs/<slug>.html
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
- `htmlBlogs` — compiles `src/blogs/**/*.html` (including its `partials/`) into `docs/blogs`.
- `htmlStore` — compiles `src/store/**/*.html` (including its `partials/`) into `docs/store`.
- `assets` — copies `src/assets/**/*` into `docs/assets`.
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

A blog post needs three things:

1. **The full page** — `src/blogs/<slug>.html`. Copy an existing one (e.g.
   `src/blogs/java-makes-it-easy-to-write-bad-code.html`) and update the `og:*`/`twitter:*` meta
   tags (title, description, url, canonical) so the post has correct social-share previews, and
   point the `@@include('partials/<slug>.html')` at your new partial.
2. **The content partial** — `src/blogs/partials/<slug>.html`. This is just the actual article
   markup (heading + paragraphs), wrapped in a `<section>`. Every existing post starts with a
   "← Back to Blogs" link right under the opening `<div>` — keep that for consistency.
3. **A listing entry** — add an object to the `blogs` array at the bottom of
   `src/partials/pages/blogs.html` so it shows up as a card on `/blogs.html`:

```html
<script>
    const blogs = [
        {
            name: 'My New Post Title',
            url: '/my-new-post.html',
            description: 'One sentence describing what this post is about.'
        },
        // ...existing entries
    ];
</script>
```

`url` must match the filename you gave `src/blogs/<slug>.html` (the listing links to
`/blogs${blog.url}`). Run `yarn start`/`yarn build` and the new card + page will appear.

## Adding a new store product or course

Same three-piece pattern as blogs, under `src/store/` instead of `src/blogs/`:

1. **The full page** — `src/store/<slug>.html`, with its own `og:*`/`twitter:*` meta tags
   (including `product:price:amount`/`product:price:currency`) so sharing the product link on
   social media shows that product's own preview, not the generic site card.
2. **The content partial** — `src/store/partials/<slug>.html` with the product/course detail
   layout (image, description, price, buy/curriculum link). Include a "← Back to Store" link like
   the existing entries.
3. **A listing entry** — add an object to the `products` array at the bottom of
   `src/partials/pages/store.html`:

```html
<script>
    const products = [
        {
            slug: 'advanced-dev-course',       // must match src/store/<slug>.html
            type: 'course',                    // 'content' (Content section) or 'course' (Courses section)
            name: 'Advanced Dev',
            description: 'A follow-up course to Intro to Dev.',
            price: '$150',
            image: '/assets/intro-to-dev-cartoon.svg',
            url: '/store/advanced-dev-course.html',   // external link (e.g. Gumroad) or an on-site page
            buyLabel: 'View Curriculum',               // optional, defaults to "Buy Now"
            startDate: '2027-01-10',                   // courses only — used to sort soonest-first
            secret: false,                              // see flags below
            preview: false                              // see flags below
        }
    ];
</script>
```

- `type: 'content'` items render in the **Content** section (simple list, appears first — no
  particular visual polish needed).
- `type: 'course'` items render in the **Courses** section (card grid, sorted so the item with the
  soonest `startDate` shows first; items without a `startDate` sort last and show "Date TBD").
- If `url` starts with `http`, the buy/details link opens in a new tab; otherwise it's treated as
  an on-site page and opens in the same tab.

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
            slug: 'advanced-dev-course',
            type: 'course',
            name: 'Advanced Dev',
            description: 'A follow-up course to Intro to Dev.',
            price: '$150',
            image: '/assets/intro-to-dev-cartoon.svg',
            url: '/store/advanced-dev-course.html',
            buyLabel: 'View Curriculum',
            startDate: '2027-01-10',
            secret: true,   // not rendered at all until this is removed/set to false
            preview: true   // ready for when secret flips to false — will show greyed out + "Coming Soon"
        }
    ];
</script>
```

Note: `secret` only hides the item from the rendered page — the object is still present in the
page's plain JS source, so it isn't a true access-control mechanism, just a way to stage content
ahead of launch.
