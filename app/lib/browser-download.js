/**
 * Start a same-origin attachment download from the user's click event.
 * A real anchor works on iOS Safari; hidden iframes commonly suppress the
 * browser's download UI on mobile devices.
 */
export function triggerBrowserDownload(documentRef, href, filename) {
  if (typeof href !== "string" || !href.startsWith("/api/download?")) {
    throw new Error("invalid download URL");
  }
  const anchor = documentRef.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  // Keep API error responses out of the app page while preserving the direct
  // user gesture required by mobile Safari's download manager.
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.style.display = "none";
  documentRef.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
