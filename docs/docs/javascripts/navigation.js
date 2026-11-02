(function () {
  const NAV_CONFIG = window.__r2kernelNavConfig || {
    storageKey: "r2kernel-primary-nav-state-v2",
    defaults: {
      Start: true,
      Concepts: false,
      Operate: false,
      Develop: false,
      Reference: false,
      Performance: false,
    },
  };
  const NAV_STATE_KEY = NAV_CONFIG.storageKey;
  const DEFAULT_STATE = Object.assign({}, NAV_CONFIG.defaults);

  let activeFetchController = null;
  let pendingPrimaryScrollTop = null;

  function loadState() {
    if (window.__r2kernelNavState && typeof window.__r2kernelNavState === "object") {
      return Object.assign({}, DEFAULT_STATE, window.__r2kernelNavState);
    }

    try {
      return Object.assign({}, DEFAULT_STATE, JSON.parse(localStorage.getItem(NAV_STATE_KEY) || "{}"));
    } catch (error) {
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  function saveState(state) {
    const next = Object.assign({}, DEFAULT_STATE, state);
    window.__r2kernelNavState = next;
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify(next));
  }

  function getTopLevelItems() {
    return Array.from(
      document.querySelectorAll(".md-sidebar--primary .md-nav--primary > .md-nav__list > .md-nav__item--nested")
    );
  }

  function getPrimaryScrollwrap() {
    return document.querySelector(".md-sidebar--primary .md-sidebar__scrollwrap");
  }

  function getSectionTitle(item) {
    if (!item) {
      return null;
    }

    const label = item.querySelector(":scope > .md-nav__toggle + .md-nav__link, :scope > .md-nav__link");
    return label ? label.textContent.replace(/\s+/g, " ").trim() : null;
  }

  function getSectionToggle(item) {
    return item ? item.querySelector(":scope > .md-nav__toggle") : null;
  }

  function notifyPageRendered() {
    document.dispatchEvent(new CustomEvent("r2kernel:page-rendered"));
  }

  function getTopLevelItemByTitle(title) {
    return (
      getTopLevelItems().find((item) => getSectionTitle(item) === title) || null
    );
  }

  function applyNavState() {
    const state = loadState();

    getTopLevelItems().forEach((item) => {
      const title = getSectionTitle(item);
      const toggle = getSectionToggle(item);
      if (!title || !toggle) {
        return;
      }

      toggle.checked = Object.prototype.hasOwnProperty.call(state, title)
        ? Boolean(state[title])
        : Boolean(DEFAULT_STATE[title]);
    });
  }

  function setSectionState(title, checked) {
    const state = loadState();
    state[title] = checked;
    saveState(state);

    getTopLevelItems().forEach((item) => {
      if (getSectionTitle(item) !== title) {
        return;
      }

      const toggle = getSectionToggle(item);
      if (toggle) {
        toggle.checked = checked;
      }
    });
  }

  function bindNavState() {
    getTopLevelItems().forEach((item) => {
      const title = getSectionTitle(item);
      const toggle = getSectionToggle(item);
      if (!title || !toggle || toggle.dataset.r2kernelBound === "true") {
        return;
      }

      toggle.dataset.r2kernelBound = "true";
      toggle.addEventListener("change", function () {
        setSectionState(title, toggle.checked);
      });
    });
  }

  function applyGroupedSectionLabels() {
    const groupedSections = ["Reference"];

    groupedSections.forEach((sectionTitle) => {
      const sectionItem = getTopLevelItemByTitle(sectionTitle);
      if (!sectionItem) {
        return;
      }

      sectionItem.classList.add("r2kernel-nav-section--grouped");

      const groupItems = Array.from(
        sectionItem.querySelectorAll(
          ":scope > nav.md-nav > .md-nav__list > .md-nav__item--nested"
        )
      );

      groupItems.forEach((item) => {
        item.classList.add("r2kernel-nav-group-label");

        const toggle = item.querySelector(":scope > .md-nav__toggle");
        if (toggle) {
          toggle.checked = true;

          if (toggle.dataset.r2kernelForcedOpen !== "true") {
            toggle.dataset.r2kernelForcedOpen = "true";
            toggle.addEventListener("change", function () {
              toggle.checked = true;
            });
          }
        }
      });
    });
  }

  function normalizeDocPath(input) {
    const url = input instanceof URL ? new URL(input.href) : new URL(String(input), window.location.href);
    return (
      url.pathname.replace(/index\.html$/, "").replace(/\/+$/, "/") +
      url.search
    );
  }

  function isHtmlLikePath(pathname) {
    if (pathname.endsWith("/")) {
      return true;
    }

    const match = pathname.match(/\.([a-z0-9]+)$/i);
    if (!match) {
      return true;
    }

    return match[1].toLowerCase() === "html";
  }

  function findPrimaryLinkByHref(href) {
    const normalized = normalizeDocPath(href);

    return (
      Array.from(document.querySelectorAll(".md-sidebar--primary a.md-nav__link[href]")).find((link) => {
        return (link.dataset.r2kernelShellHref || normalizeDocPath(link.href)) === normalized;
      }) || null
    );
  }

  function preparePrimaryShell() {
    const sidebar = document.querySelector(".md-sidebar--primary");
    if (!sidebar) {
      return;
    }

    sidebar.querySelectorAll("a.md-nav__link[href]").forEach((link) => {
      const rawHref = link.getAttribute("href");
      if (!rawHref) {
        return;
      }

      if (rawHref.startsWith("#")) {
        const item = link.closest(".md-nav__item");
        if (item) {
          item.remove();
        }
        return;
      }

      const absolute = new URL(rawHref, window.location.href).href;
      link.href = absolute;
      link.dataset.r2kernelShellHref = normalizeDocPath(absolute);
    });

    sidebar.querySelectorAll("nav.md-nav, ul.md-nav__list").forEach((node) => {
      if (node.querySelector("a.md-nav__link[href]")) {
        return;
      }

      if (node.matches("nav.md-nav")) {
        node.remove();
        return;
      }

      if (node.matches("ul.md-nav__list")) {
        const parentItem = node.closest(".md-nav__item");
        if (parentItem && !parentItem.querySelector(":scope > a.md-nav__link[href]")) {
          node.remove();
        }
      }
    });
  }

  function restorePrimaryScrollTop() {
    const scrollwrap = getPrimaryScrollwrap();
    if (!scrollwrap || pendingPrimaryScrollTop === null) {
      return;
    }

    scrollwrap.scrollTop = pendingPrimaryScrollTop;
  }

  function clearPrimaryActiveState() {
    document
      .querySelectorAll(".md-sidebar--primary .md-nav__link--active")
      .forEach((link) => {
        link.classList.remove("md-nav__link--active");
        link.removeAttribute("aria-current");
      });

    document
      .querySelectorAll(".md-sidebar--primary .md-nav__item--active")
      .forEach((item) => item.classList.remove("md-nav__item--active"));
  }

  function findTopLevelItemForLink(link) {
    return getTopLevelItems().find((item) => item.contains(link)) || null;
  }

  function ensureTopLevelSectionOpen(link) {
    const item = findTopLevelItemForLink(link);
    const title = getSectionTitle(item);
    const toggle = getSectionToggle(item);

    if (!title || !toggle) {
      return;
    }

    if (!toggle.checked) {
      toggle.checked = true;
    }

    const state = loadState();
    if (!state[title]) {
      state[title] = true;
      saveState(state);
    }
  }

  function markPrimaryActiveLink(href) {
    const link = findPrimaryLinkByHref(href);
    if (!link) {
      return;
    }

    clearPrimaryActiveState();
    ensureTopLevelSectionOpen(link);

    link.classList.add("md-nav__link--active");
    link.setAttribute("aria-current", "page");

    let item = link.closest(".md-nav__item");
    while (item && document.querySelector(".md-sidebar--primary").contains(item)) {
      item.classList.add("md-nav__item--active");
      item = item.parentElement ? item.parentElement.closest(".md-nav__item") : null;
    }
  }

  function updateBreadcrumbsFromDocument(nextDocument) {
    const target = document.querySelector(".r2kernel-breadcrumbs");
    const source = nextDocument.querySelector(".r2kernel-breadcrumbs");

    if (target && source) {
      target.innerHTML = source.innerHTML;
    }
  }

  function syncScopedAttributes(target, source, predicate) {
    if (!target || !source) {
      return;
    }

    Array.from(target.attributes).forEach((attribute) => {
      if (!predicate(attribute.name)) {
        return;
      }

      if (!source.hasAttribute(attribute.name)) {
        target.removeAttribute(attribute.name);
      }
    });

    Array.from(source.attributes).forEach((attribute) => {
      if (!predicate(attribute.name)) {
        return;
      }

      target.setAttribute(attribute.name, attribute.value);
    });
  }

  function syncDocumentPresentationState(nextDocument) {
    syncScopedAttributes(
      document.documentElement,
      nextDocument.documentElement,
      function (name) {
        return (
          name === "class" ||
          name === "lang" ||
          name === "dir" ||
          name.startsWith("data-md-")
        );
      }
    );

    syncScopedAttributes(
      document.body,
      nextDocument.body,
      function (name) {
        return (
          name === "class" ||
          name.startsWith("data-md-")
        );
      }
    );
  }

  function replaceContentAreas(nextDocument) {
    const currentContent = document.querySelector(".md-content");
    const nextContent = nextDocument.querySelector(".md-content");

    if (!currentContent || !nextContent) {
      throw new Error("Unable to locate content container for shell navigation.");
    }

    currentContent.replaceWith(nextContent);

    const currentSecondary = document.querySelector(".md-sidebar--secondary");
    const nextSecondary = nextDocument.querySelector(".md-sidebar--secondary");
    const mainInner = document.querySelector(".md-main__inner");

    if (currentSecondary && nextSecondary) {
      currentSecondary.replaceWith(nextSecondary);
    } else if (currentSecondary && !nextSecondary) {
      currentSecondary.remove();
    } else if (!currentSecondary && nextSecondary && mainInner) {
      mainInner.appendChild(nextSecondary);
    }
  }

  function scrollToHash(hash) {
    if (!hash) {
      return false;
    }

    const id = decodeURIComponent(hash.replace(/^#/, ""));
    if (!id) {
      return false;
    }

    const target =
      document.getElementById(id) ||
      document.querySelector(`[name="${CSS.escape(id)}"]`);

    if (!target) {
      return false;
    }

    target.scrollIntoView({ block: "start" });
    return true;
  }

  function scrollMainViewport(url) {
    window.requestAnimationFrame(function () {
      if (url.hash && scrollToHash(url.hash)) {
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  function shouldHandleShellNavigation(link, event) {
    if (!link || event.defaultPrevented || event.button !== 0) {
      return false;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    if (link.target && link.target !== "_self") {
      return false;
    }

    if (link.hasAttribute("download")) {
      return false;
    }

    if (!link.closest(".md-sidebar--primary, .r2kernel-brand, .r2kernel-breadcrumbs")) {
      return false;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return false;
    }

    if (!/^https?:$/.test(url.protocol)) {
      return false;
    }

    if (!isHtmlLikePath(url.pathname)) {
      return false;
    }

    if (normalizeDocPath(url) === normalizeDocPath(window.location.href) && !url.hash) {
      return false;
    }

    return true;
  }

  async function fetchPageDocument(url) {
    if (activeFetchController) {
      activeFetchController.abort();
    }

    activeFetchController = new AbortController();
    const controller = activeFetchController;

    const response = await fetch(url.href, {
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        "X-Requested-With": "r2kernel-shell",
      },
    });

    if (!response.ok) {
      throw new Error("Shell navigation fetch failed.");
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error("Shell navigation target is not HTML.");
    }

    const html = await response.text();
    const nextDocument = new DOMParser().parseFromString(html, "text/html");
    const finalUrl = new URL(response.url || url.href, window.location.href);

    if (activeFetchController === controller) {
      activeFetchController = null;
    }

    return { nextDocument, finalUrl };
  }

  async function navigateWithinShell(targetUrl, options) {
    const url = targetUrl instanceof URL ? new URL(targetUrl.href) : new URL(String(targetUrl), window.location.href);
    const push = !options || options.push !== false;
    const preservePrimaryScroll = options && typeof options.primaryScrollTop === "number"
      ? options.primaryScrollTop
      : null;

    // popstate has already changed location, which may no longer describe the
    // rendered content. Only link clicks can take this same-page shortcut.
    if (
      push &&
      normalizeDocPath(url) === normalizeDocPath(window.location.href) &&
      url.hash &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    ) {
      if (push) {
        window.history.pushState({ r2kernelShell: true }, "", url.href);
      }
      scrollMainViewport(url);
      return;
    }

    document.documentElement.classList.add("r2kernel-nav-pending");

    try {
      const { nextDocument, finalUrl } = await fetchPageDocument(url);

      syncDocumentPresentationState(nextDocument);
      replaceContentAreas(nextDocument);
      updateBreadcrumbsFromDocument(nextDocument);
      markPrimaryActiveLink(finalUrl.href);
      document.title = nextDocument.title || document.title;

      if (push) {
        window.history.pushState({ r2kernelShell: true }, "", finalUrl.href);
      }

      pendingPrimaryScrollTop = preservePrimaryScroll;
      restorePrimaryScrollTop();
      scrollMainViewport(finalUrl);
      // The shell replaces content without Material's instant navigation.
      // Refresh its document stream so new code blocks get copy controls and
      // components release their subscriptions to the previous content.
      window.document$.next(document);
      notifyPageRendered();
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      window.location.href = url.href;
      return;
    } finally {
      restorePrimaryScrollTop();
      document.documentElement.classList.remove("r2kernel-nav-pending");
    }
  }

  function bindShellNavigation() {
    if (document.documentElement.dataset.r2kernelShellBound === "true") {
      return;
    }

    document.documentElement.dataset.r2kernelShellBound = "true";

    document.addEventListener("mousedown", function (event) {
      const link = event.target.closest("a[href]");
      if (!shouldHandleShellNavigation(link, event)) {
        return;
      }

      const primaryScrollwrap = getPrimaryScrollwrap();
      pendingPrimaryScrollTop = link.closest(".md-sidebar--primary") && primaryScrollwrap
        ? primaryScrollwrap.scrollTop
        : null;
    }, true);

    document.addEventListener("click", function (event) {
      const link = event.target.closest("a[href]");
      if (!shouldHandleShellNavigation(link, event)) {
        return;
      }

      const primaryScrollwrap = getPrimaryScrollwrap();
      pendingPrimaryScrollTop = link.closest(".md-sidebar--primary") && primaryScrollwrap
        ? (pendingPrimaryScrollTop !== null ? pendingPrimaryScrollTop : primaryScrollwrap.scrollTop)
        : null;
      event.preventDefault();
      window.requestAnimationFrame(restorePrimaryScrollTop);
      navigateWithinShell(link.href, { push: true, primaryScrollTop: pendingPrimaryScrollTop });
    }, true);

    window.addEventListener("popstate", function () {
      navigateWithinShell(window.location.href, { push: false });
    });
  }

  function initialize() {
    preparePrimaryShell();
    applyNavState();
    bindNavState();
    applyGroupedSectionLabels();
    bindShellNavigation();
    markPrimaryActiveLink(window.location.href);
    notifyPageRendered();
    document.documentElement.classList.remove("r2kernel-nav-pending");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
