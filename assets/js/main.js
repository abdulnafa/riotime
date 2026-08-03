(() => {
  "use strict";

  const doc = document;
  const body = doc.body;
  const navbar = doc.querySelector(".site-navbar");
  const navCollapse = doc.querySelector(".navbar-collapse");
  const navToggler = doc.querySelector(".navbar-toggler");
  const backToTop = doc.querySelector(".back-to-top");
  const hasBootstrap = typeof window.bootstrap !== "undefined";

  // Keep copyright dates current.
  doc.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  // Compact header and expose the back-to-top action after the first viewport.
  const updateScrollState = () => {
    const hasScrolled = window.scrollY > 24;
    navbar?.classList.toggle("is-scrolled", hasScrolled);
    backToTop?.classList.toggle("is-visible", window.scrollY > 650);
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Bootstrap's mobile collapse is styled as a drawer.
  if (navCollapse) {
    navCollapse.addEventListener("show.bs.collapse", () => body.classList.add("menu-open"));
    navCollapse.addEventListener("hidden.bs.collapse", () => body.classList.remove("menu-open"));

    // Keep navigation usable if the CDN bundle is unavailable.
    if (!hasBootstrap && navToggler) {
      navToggler.addEventListener("click", () => {
        const willOpen = !navCollapse.classList.contains("show");
        navCollapse.classList.toggle("show", willOpen);
        navToggler.setAttribute("aria-expanded", String(willOpen));
        body.classList.toggle("menu-open", willOpen);
      });
    }

    navCollapse.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 992 && navCollapse.classList.contains("show")) {
          if (hasBootstrap) {
            window.bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
          } else {
            navCollapse.classList.remove("show");
            navToggler?.setAttribute("aria-expanded", "false");
            body.classList.remove("menu-open");
          }
        }
      });
    });
  }

  // Bootstrap-free accordion fallback for restrictive networks or CDN outages.
  if (!hasBootstrap) {
    doc.querySelectorAll('[data-bs-toggle="collapse"]').forEach((trigger) => {
      if (trigger === navToggler) return;

      trigger.addEventListener("click", () => {
        const selector = trigger.getAttribute("data-bs-target");
        const target = selector ? doc.querySelector(selector) : null;
        if (!target) return;

        const accordion = target.closest(".accordion");
        const willOpen = !target.classList.contains("show");

        if (accordion && willOpen) {
          accordion.querySelectorAll(".accordion-collapse.show").forEach((openPanel) => {
            if (openPanel === target) return;
            openPanel.classList.remove("show");
            const openTrigger = accordion.querySelector(
              `[data-bs-target="#${openPanel.id}"]`
            );
            openTrigger?.classList.add("collapsed");
            openTrigger?.setAttribute("aria-expanded", "false");
          });
        }

        target.classList.toggle("show", willOpen);
        trigger.classList.toggle("collapsed", !willOpen);
        trigger.setAttribute("aria-expanded", String(willOpen));
      });
    });
  }

  // Reveal content as it enters the viewport, while respecting reduced-motion CSS.
  const revealNodes = [...doc.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px" }
    );
    revealNodes.forEach((node) => revealObserver.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  // Project category filtering.
  const filterButtons = [...doc.querySelectorAll("[data-project-filter]")];
  const projectItems = [...doc.querySelectorAll("[data-project-category]")];

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.projectFilter;

      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      projectItems.forEach((item) => {
        const categories = (item.dataset.projectCategory || "").split(" ");
        const shouldShow = category === "all" || categories.includes(category);
        item.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });

  // Highlight the relevant service tab as users move through the service page.
  const serviceSections = [...doc.querySelectorAll(".service-detail[id]")];
  const serviceLinks = [...doc.querySelectorAll(".service-nav a[href^='#']")];

  if (serviceSections.length && "IntersectionObserver" in window) {
    const serviceObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        serviceLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${visibleEntry.target.id}`
          );
        });
      },
      { threshold: [0.25, 0.5], rootMargin: "-110px 0px -45% 0px" }
    );

    serviceSections.forEach((section) => serviceObserver.observe(section));
  }

  // Static-host-friendly enquiry form: validate locally and hand the message to WhatsApp.
  doc.querySelectorAll("[data-whatsapp-form]").forEach((form) => {
    const successMessage = form.querySelector(".form-alert");
    const requestedService = new URLSearchParams(window.location.search).get("service");
    const serviceSelect = form.querySelector("[name='service']");

    if (requestedService && serviceSelect) {
      const matchingOption = [...serviceSelect.options].find(
        (option) => option.value === requestedService
      );
      if (matchingOption) serviceSelect.value = requestedService;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add("was-validated");

      if (!form.checkValidity()) return;

      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const service = serviceSelect?.selectedOptions?.[0]?.text?.trim()
        || String(formData.get("service") || "General enquiry").trim();
      const property = String(formData.get("property") || "").trim();
      const location = String(formData.get("location") || "").trim();
      const message = String(formData.get("message") || "").trim();
      const page = doc.title;
      const whatsappNumber = form.dataset.whatsapp || "971552625454";

      const whatsappMessage = [
        "Hello RIOTIME, I would like to request a consultation.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Service: ${service}`,
        ...(property ? [`Company / property: ${property}`] : []),
        ...(location ? [`Project location: ${location}`] : []),
        `Message: ${message || "Please contact me to discuss the requirement."}`,
        `Page: ${page}`
      ].join("\n");

      successMessage?.classList.add("is-visible");
      successMessage?.setAttribute("role", "status");

      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
        "_blank",
        "noopener,noreferrer"
      );
    });
  });
})();
