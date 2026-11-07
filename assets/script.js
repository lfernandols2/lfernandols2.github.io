(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.getElementById("siteHeader");
  var progress = document.getElementById("progress");
  var backToTop = document.getElementById("backToTop");
  var navMenu = document.getElementById("navMenu");
  var navToggle = document.getElementById("navToggle");
  var themeToggle = document.getElementById("themeToggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function closeMenu() {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menu");
  }

  function updateThemeButton() {
    var dark = root.classList.contains("dark");
    themeToggle.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
    themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
    if (themeMeta) {
      themeMeta.setAttribute("content", dark ? "#070c16" : "#081527");
    }
  }

  updateThemeButton();

  themeToggle.addEventListener("click", function () {
    var dark = root.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch (e) {}
    updateThemeButton();
  });

  navToggle.addEventListener("click", function () {
    var open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  navMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", function (event) {
    if (!navMenu.classList.contains("open")) return;
    if (navMenu.contains(event.target) || navToggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  var ticking = false;

  function updateScrollState() {
    var scrollTop = window.scrollY || root.scrollTop || document.body.scrollTop || 0;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = height > 0 ? Math.min(scrollTop / height, 1) : 0;

    progress.style.width = (ratio * 100) + "%";
    header.classList.toggle("scrolled", scrollTop > 8);
    backToTop.classList.toggle("show", scrollTop > 620);
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateScrollState();

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  var navLinks = Array.prototype.slice.call(navMenu.querySelectorAll('a[href^="#"]'));
  var sections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute("href"));
  }).filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("active", active);
          if (active) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-42% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  var revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("visible");
    });
  }

  var counters = document.querySelectorAll("[data-count]");

  function animateCounter(element) {
    var target = parseInt(element.getAttribute("data-count"), 10);
    if (reduceMotion || !isFinite(target)) {
      element.textContent = String(target || 0);
      return;
    }

    var started = null;
    var duration = 1100;

    function step(timestamp) {
      if (started === null) started = timestamp;
      var progressValue = Math.min((timestamp - started) / duration, 1);
      var eased = 1 - Math.pow(1 - progressValue, 3);
      element.textContent = String(Math.round(target * eased));
      if (progressValue < 1) {
        window.requestAnimationFrame(step);
      }
    }

    element.textContent = "0";
    window.requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.55 });

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  } else {
    counters.forEach(animateCounter);
  }

  var pubList = document.getElementById("pubList");
  var pubSearch = document.getElementById("pubSearch");
  var pubYear = document.getElementById("pubYear");
  var pubCount = document.getElementById("pubCount");
  var pubEmpty = document.getElementById("pubEmpty");
  var loadMore = document.getElementById("loadMore");
  var pubItems = pubList ? Array.prototype.slice.call(pubList.querySelectorAll(".pub-item")) : [];
  var visibleCount = 6;

  function applyPublicationFilters(reset) {
    if (!pubList) return;
    if (reset) visibleCount = 6;

    var query = pubSearch.value.trim().toLowerCase();
    var year = pubYear.value;

    var matches = pubItems.filter(function (item) {
      var matchesYear = year === "all" || item.getAttribute("data-year") === year;
      var matchesText = !query || item.textContent.toLowerCase().indexOf(query) !== -1;
      return matchesYear && matchesText;
    });

    pubItems.forEach(function (item) {
      item.hidden = true;
    });

    matches.slice(0, visibleCount).forEach(function (item) {
      item.hidden = false;
    });

    var shown = Math.min(visibleCount, matches.length);
    pubCount.textContent = "Mostrando " + shown + " de " + matches.length + (matches.length === 1 ? " publicação" : " publicações");
    if (pubEmpty) {
      pubEmpty.hidden = matches.length !== 0;
    }

    if (matches.length <= visibleCount) {
      loadMore.hidden = true;
    } else {
      loadMore.hidden = false;
      loadMore.textContent = "Mostrar mais publicações (" + (matches.length - visibleCount) + ")";
    }
  }

  if (pubList) {
    pubSearch.addEventListener("input", function () {
      applyPublicationFilters(true);
    });
    pubYear.addEventListener("change", function () {
      applyPublicationFilters(true);
    });
    loadMore.addEventListener("click", function () {
      visibleCount += 6;
      applyPublicationFilters(false);
    });
    applyPublicationFilters(true);
  }

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".tab-panel"));

  function activateTab(tab) {
    tabs.forEach(function (item) {
      var active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
      item.setAttribute("tabindex", active ? "0" : "-1");
    });

    panels.forEach(function (panel) {
      panel.classList.toggle("active", panel.id === tab.getAttribute("aria-controls"));
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });

    tab.addEventListener("keydown", function (event) {
      var current = tabs.indexOf(tab);
      var next = null;

      if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;

      if (next !== null) {
        event.preventDefault();
        tabs[next].focus();
        activateTab(tabs[next]);
      }
    });
  });

  var copyPhone = document.getElementById("copyPhone");
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  if (copyPhone) {
    copyPhone.addEventListener("click", function () {
      var email = "luizlobato@alu.ufc.br";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () {
          showToast("E-mail copiado");
        }).catch(function () {
          showToast(fallbackCopy(email) ? "E-mail copiado" : "Não foi possível copiar");
        });
      } else {
        showToast(fallbackCopy(email) ? "E-mail copiado" : "Não foi possível copiar");
      }
    });
  }

  var yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  window.__personalSiteReady = true;
})();
