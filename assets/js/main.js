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

  // Three-frame page banners with independent, accessible autoplay controls.
  doc.querySelectorAll("[data-banner-slider]").forEach((slider) => {
    const slides = [...slider.querySelectorAll("[data-banner-slide]")];

    // Every page banner is intentionally a three-image story. Ignore incomplete
    // markup instead of leaving a partially working control behind.
    if (slides.length !== 3) return;

    const dots = [...slider.querySelectorAll("[data-slide-to]")];
    const toggle = slider.querySelector("[data-slider-toggle]");
    const toggleIcon = toggle?.querySelector("[data-slider-toggle-icon], .bi");
    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    const requestedInterval = Number.parseInt(slider.dataset.interval || "", 10);
    const interval = Number.isFinite(requestedInterval) && requestedInterval > 0
      ? requestedInterval
      : 2000;
    const requestedTransition = Number.parseInt(slider.dataset.transition || "", 10);
    const transitionDuration = Number.isFinite(requestedTransition)
      && requestedTransition >= 0
      ? requestedTransition
      : 850;

    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let autoplayTimer = null;
    let transitionTimer = null;
    let userPaused = false;
    let motionPaused = Boolean(reducedMotion?.matches);

    if (activeIndex < 0) activeIndex = 0;

    const updateControls = () => {
      dots.forEach((dot) => {
        const dotIndex = Number.parseInt(dot.dataset.slideTo || "", 10);
        const isCurrent = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isCurrent);
        dot.setAttribute("aria-current", String(isCurrent));
        dot.setAttribute("aria-label", `Show banner slide ${dotIndex + 1} of 3`);
      });

      if (!toggle) return;

      const isPaused = userPaused || motionPaused;
      toggle.classList.toggle("is-paused", isPaused);
      toggle.disabled = motionPaused;
      toggle.setAttribute("aria-disabled", String(motionPaused));
      toggle.setAttribute("aria-pressed", String(isPaused));
      toggle.setAttribute(
        "aria-label",
        motionPaused
          ? "Automatic banner rotation disabled for reduced motion"
          : isPaused
            ? "Play banner slideshow"
            : "Pause banner slideshow"
      );

      if (toggleIcon) {
        toggleIcon.classList.toggle("bi-pause-fill", !isPaused);
        toggleIcon.classList.toggle("bi-play-fill", isPaused);
        toggleIcon.setAttribute("aria-hidden", "true");
      }
    };

    const updateSlides = () => {
      slides.forEach((slide, index) => {
        const isCurrent = index === activeIndex;
        slide.classList.toggle("is-active", isCurrent);
        slide.setAttribute("aria-hidden", String(!isCurrent));
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        if (!slide.hasAttribute("aria-label")) {
          slide.setAttribute("aria-label", `${index + 1} of 3`);
        }

        // Prevent controls inside an inactive slide from entering the tab order.
        if ("inert" in slide) slide.inert = !isCurrent;
      });
    };

    const stopAutoplay = () => {
      if (autoplayTimer !== null) {
        window.clearTimeout(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const canAutoplay = () => !userPaused && !motionPaused && !doc.hidden;

    const showSlide = (requestedIndex) => {
      const nextIndex = ((requestedIndex % slides.length) + slides.length) % slides.length;
      if (nextIndex === activeIndex) return;

      const outgoingSlide = slides[activeIndex];
      const incomingSlide = slides[nextIndex];

      if (transitionTimer !== null) window.clearTimeout(transitionTimer);
      slides.forEach((slide) => slide.classList.remove("is-entering", "is-leaving"));

      outgoingSlide.classList.remove("is-active");
      outgoingSlide.classList.add("is-leaving");
      incomingSlide.classList.add("is-active", "is-entering");
      slider.classList.add("is-transitioning");
      activeIndex = nextIndex;

      updateSlides();
      updateControls();

      transitionTimer = window.setTimeout(() => {
        outgoingSlide.classList.remove("is-leaving");
        incomingSlide.classList.remove("is-entering");
        slider.classList.remove("is-transitioning");
        transitionTimer = null;
      }, transitionDuration);
    };

    const scheduleAutoplay = () => {
      stopAutoplay();
      if (!canAutoplay()) return;

      autoplayTimer = window.setTimeout(() => {
        showSlide(activeIndex + 1);
        scheduleAutoplay();
      }, interval);
    };

    slides.forEach((slide) => slide.classList.remove("is-entering", "is-leaving"));
    updateSlides();
    updateControls();

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const dotIndex = Number.parseInt(dot.dataset.slideTo || "", 10);
        if (!Number.isInteger(dotIndex) || dotIndex < 0 || dotIndex >= 3) return;
        showSlide(dotIndex);
        scheduleAutoplay();
      });
    });

    toggle?.addEventListener("click", () => {
      userPaused = !userPaused;
      updateControls();
      scheduleAutoplay();
    });

    doc.addEventListener("visibilitychange", scheduleAutoplay);

    const handleMotionPreference = (event) => {
      motionPaused = event.matches;
      updateControls();
      scheduleAutoplay();
    };

    if (typeof reducedMotion?.addEventListener === "function") {
      reducedMotion.addEventListener("change", handleMotionPreference);
    } else if (typeof reducedMotion?.addListener === "function") {
      reducedMotion.addListener(handleMotionPreference);
    }

    scheduleAutoplay();
  });

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
