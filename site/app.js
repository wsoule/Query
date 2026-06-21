const releasesUrl = "https://github.com/wsoule/Query/releases";
const releasesApiUrl = "https://api.github.com/repos/wsoule/Query/releases";
const copyButtons = document.querySelectorAll("[data-copy]");
const primaryDownload = document.querySelector("[data-primary-download]");
const releaseStatus = document.querySelector("[data-release-status]");
const releaseVersion = document.querySelector("[data-release-version]");

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

copyButtons.forEach((button) => {
  const originalText = button.textContent.trim();

  function showCopied() {
    button.textContent = "Copied";
    button.classList.add("copied");
    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 1400);
  }

  button.addEventListener("click", async () => {
    const text = button.getAttribute("data-copy") || "";

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }

      showCopied();
    } catch {
      fallbackCopy(text);
      showCopied();
    }
  });
});

function pickRelease(releases) {
  const visibleReleases = releases.filter((release) => !release.draft);

  return visibleReleases.find((release) => !release.prerelease) || visibleReleases[0] || null;
}

function findAsset(assets, target) {
  const byName = (test) => assets.find((asset) => test(asset.name));

  if (target === "macos-arm") {
    return byName((name) => /\.dmg$/i.test(name) && /(aarch64|arm64)/i.test(name));
  }

  if (target === "macos-intel") {
    return byName((name) => /\.dmg$/i.test(name) && /(x64|x86_64)/i.test(name));
  }

  if (target === "windows") {
    const windowsAssets = assets.filter((asset) => /\.(msi|exe)$/i.test(asset.name));

    return (
      windowsAssets.find((asset) => /setup\.exe$/i.test(asset.name)) ||
      windowsAssets.find((asset) => /\.msi$/i.test(asset.name)) ||
      windowsAssets[0] ||
      null
    );
  }

  if (target === "linux-appimage") {
    return byName((name) => /\.appimage$/i.test(name));
  }

  if (target === "linux-deb") {
    return byName((name) => /\.deb$/i.test(name));
  }

  return null;
}

function downloadLabel(target) {
  if (target === "windows") {
    return "Download installer";
  }

  if (target.startsWith("linux")) {
    return "Download package";
  }

  return "Download DMG";
}

function updateDownloadCards(release) {
  const assetsByTarget = {};
  const targets = ["macos-arm", "macos-intel", "windows", "linux-appimage", "linux-deb"];

  targets.forEach((target) => {
    const link = document.querySelector(`[data-download="${target}"]`);
    const card = link?.closest(".download-card");
    const asset = findAsset(release.assets || [], target);
    assetsByTarget[target] = asset;

    if (!link || !card) {
      return;
    }

    if (asset) {
      link.href = asset.browser_download_url;
      link.textContent = downloadLabel(target);
      link.title = asset.name;
      card.classList.remove("unavailable");
    } else {
      link.href = release.html_url || releasesUrl;
      link.textContent = "View releases";
      link.removeAttribute("title");
      card.classList.add("unavailable");
    }
  });

  return assetsByTarget;
}

function updatePrimaryDownload(assetsByTarget, release) {
  if (!primaryDownload) {
    return;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  let target = null;

  if (userAgent.includes("windows")) {
    target = "windows";
  } else if (userAgent.includes("linux")) {
    target = assetsByTarget["linux-appimage"] ? "linux-appimage" : "linux-deb";
  } else if (userAgent.includes("mac")) {
    const macAssets = [assetsByTarget["macos-arm"], assetsByTarget["macos-intel"]].filter(Boolean);

    if (macAssets.length === 1) {
      primaryDownload.href = macAssets[0].browser_download_url;
      primaryDownload.textContent = "Download for macOS";
      return;
    }

    primaryDownload.href = "#install";
    primaryDownload.textContent = "Choose macOS download";
    return;
  }

  const asset = target ? assetsByTarget[target] : null;

  if (asset) {
    primaryDownload.href = asset.browser_download_url;
    primaryDownload.textContent = "Download Query";
  } else {
    primaryDownload.href = release.html_url || releasesUrl;
    primaryDownload.textContent = "View latest release";
  }
}

async function loadDownloads() {
  try {
    const response = await fetch(releasesApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub releases request failed: ${response.status}`);
    }

    const releases = await response.json();
    const release = pickRelease(releases);

    if (!release) {
      throw new Error("No published releases found.");
    }

    const assetsByTarget = updateDownloadCards(release);
    updatePrimaryDownload(assetsByTarget, release);

    if (releaseStatus) {
      const status = release.prerelease ? "Latest prerelease" : "Latest release";
      releaseStatus.textContent = `${status}: ${release.tag_name}`;
    }

    if (releaseVersion) {
      releaseVersion.textContent = `Query ${release.tag_name.replace(/^v/, "")}`;
    }
  } catch (error) {
    if (releaseStatus) {
      releaseStatus.textContent = "Downloads are available from GitHub Releases.";
    }

    if (primaryDownload) {
      primaryDownload.href = releasesUrl;
      primaryDownload.textContent = "View releases";
    }
  }
}

loadDownloads();
