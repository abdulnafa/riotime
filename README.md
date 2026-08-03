# RIOTIME Technical Services — static website

A responsive, multi-page presentation website for **RIOTIME Technical Services L.L.C**, built with semantic HTML, custom CSS, Bootstrap 5 and vanilla JavaScript.

## Pages

- `index.html` — home
- `about.html` — company overview
- `services.html` — full service catalogue
- `projects.html` — verified project experience and genuine project photos
- `contact.html` — contact details, map and WhatsApp enquiry flow
- `404.html` — GitHub Pages fallback

## Preview locally

Open `index.html` directly in a browser, or use a local static server such as VS Code Live Server.

## GitHub Pages

The included workflow at `.github/workflows/pages.yml` publishes the repository as a static GitHub Pages site whenever the `main` branch is updated.

1. Create or connect a GitHub repository.
2. Push this project to the `main` branch.
3. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** if it is not selected automatically.
4. The deployment URL will appear in the workflow summary and the repository's Pages settings.

## Content notes

- Company details and service scope were sourced from the supplied company-profile PDF.
- Queen Elizabeth 2 and Al Rawdha Palace images are genuine project collages extracted from the supplied profile.
- Other hero/service photography was generated specifically for this presentation and contains no third-party branding. These images are representative service visuals and are not presented as photographs of named RIOTIME projects.
- The enquiry form validates in the browser and opens a prepared WhatsApp message; no form data is stored by this static site.
- Unverified testimonials, service-hour claims and years-of-experience figures are intentionally excluded until the client confirms them in writing.
