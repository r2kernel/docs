(function () {
  const R2KERNEL_MERMAID_CONFIG = {
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      darkMode: true,
      background: "#08121f",
      primaryColor: "#4d637d",
      primaryBorderColor: "#a9c6e5",
      primaryTextColor: "#f2f6fb",
      secondaryColor: "#0c1a2a",
      secondaryTextColor: "#f2f6fb",
      tertiaryColor: "#314256",
      tertiaryBorderColor: "#93aecb",
      tertiaryTextColor: "#f2f6fb",
      mainBkg: "#4d637d",
      nodeBorder: "#a9c6e5",
      clusterBkg: "#314256",
      clusterBorder: "#93aecb",
      lineColor: "#d8e0eb",
      defaultLinkColor: "#d8e0eb",
      titleColor: "#f2f6fb",
      edgeLabelBackground: "#0c1a2a",
      textColor: "#f2f6fb",
      fontFamily: "Noto Serif",
    },
    themeCSS: `
      .cluster rect {
        fill: #314256 !important;
        fill-opacity: 1 !important;
        stroke: #93aecb !important;
        stroke-opacity: 1 !important;
      }

      .cluster text,
      .cluster span,
      .cluster-label text,
      .cluster-label span {
        fill: #f2f6fb !important;
        color: #f2f6fb !important;
      }

      .node rect,
      .node circle,
      .node ellipse,
      .node polygon,
      .node path,
      .label-container {
        fill: #4d637d !important;
        fill-opacity: 1 !important;
        stroke: #a9c6e5 !important;
        stroke-opacity: 1 !important;
      }

      .nodeLabel,
      .nodeLabel span,
      .label text,
      span.edgeLabel,
      .edgeLabel text {
        fill: #f2f6fb !important;
        color: #f2f6fb !important;
      }

      .edgeLabel rect,
      .labelBkg {
        fill: #0c1a2a !important;
        fill-opacity: 1 !important;
      }

      .edgePath .path,
      .flowchart-link,
      .path {
        stroke: #d8e0eb !important;
        stroke-opacity: 1 !important;
      }

      .arrowheadPath {
        fill: #d8e0eb !important;
      }
    `,
  };

  function ensureMermaidInitialized() {
    if (typeof window.mermaid === "undefined") {
      return false;
    }

    if (window.__r2kernelMermaidInitialized === true) {
      return true;
    }

    window.mermaid.initialize(R2KERNEL_MERMAID_CONFIG);
    window.__r2kernelMermaidInitialized = true;
    return true;
  }

  function normalizeMermaidNodes() {
    const candidates = Array.from(
      document.querySelectorAll(
        ".md-content .mermaid, .md-content pre > code.language-mermaid, .md-content pre > code.mermaid"
      )
    );

    return candidates.map((node) => {
      if (node.dataset.processed === "true" || node.querySelector("svg")) {
        return null;
      }

      if (node.tagName === "PRE" || node.tagName === "CODE" || node.querySelector(":scope > code")) {
        const normalized = document.createElement("div");
        normalized.className = "mermaid";
        normalized.textContent = node.textContent.trim();
        const pre = node.tagName === "CODE" ? node.closest("pre") : null;
        (pre || node).replaceWith(normalized);
        return normalized;
      }

      return node;
    }).filter(Boolean);
  }

  function renderMermaid(attempt) {
    const nextAttempt = typeof attempt === "number" ? attempt : 0;

    if (!ensureMermaidInitialized()) {
      if (nextAttempt < 20) {
        window.setTimeout(function () {
          renderMermaid(nextAttempt + 1);
        }, 150);
      }
      return;
    }

    const nodes = normalizeMermaidNodes();
    if (!nodes.length) {
      return;
    }

    if (typeof window.mermaid.run === "function") {
      window.mermaid.run({ nodes: nodes });
      return;
    }

    if (typeof window.mermaid.init === "function") {
      window.mermaid.init(undefined, nodes);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      renderMermaid(0);
    });
  } else {
    renderMermaid(0);
  }

  document.addEventListener("r2kernel:page-rendered", function () {
    window.requestAnimationFrame(function () {
      renderMermaid(0);
    });
  });
})();
