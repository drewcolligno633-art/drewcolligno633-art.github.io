# Portfolio site

Plain HTML and CSS, no build step. Edit the files in any text editor (VS Code works well) and push to GitHub.

## Files

- `index.html` is the home page: intro, project list, about section.
- `projects/*.html` has one page per project.
- `style.css` holds every color, font, and layout rule for the whole site.
- `arm.js` draws the interactive arm on the home page.
- `images/` is where your photos and videos go.
- `resume.pdf` is not included. Add your resume to this folder with exactly that name.
- `.nojekyll` tells GitHub Pages to serve the files as-is. Leave it in place.

## Fill in the placeholders

Anything you still need to write is highlighted in yellow on the page. In the code, search all files for `class="fill"`, replace the whole `<span class="fill">[...]</span>` with your own text, and also search for `you@example.com` and `href="#"` (your email, LinkedIn, and GitHub links).

## Add a photo

1. Save it into `images/`, with a short lowercase name and no spaces (for example `arm-side.jpg`). Resize it to about 1600 px wide first so the page stays fast.
2. Find the placeholder line, which looks like `<div class="ph">Add photo: ...</div>`.
3. Replace that one line with `<img src="../images/arm-side.jpg" alt="The assembled arm, side view">` on project pages, or `src="images/..."` on the home page.

## Add a new project

1. Copy one of the files in `projects/` and rename it, for example `projects/new-thing.html`.
2. Change the title, summary, title block, and body text.
3. In `index.html`, copy one `<li class="project-row">...</li>` block in the project list and point its two links at the new page.
4. Update the "Next project" links at the bottom of the pages so they still form a loop.
