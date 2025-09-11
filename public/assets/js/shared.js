contributors_url =
  "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/refs/heads/main/public/assets/data/contributors.json";

configLines = [];

function copyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;

  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, 99999);

  document.execCommand("copy");
  document.body.removeChild(textarea);
  document.body.focus();
  alert(`Text copied to clipboard!`);
}

function shuffle(array, shuffleCount = 1) {
  for (let index = 0; index < shuffleCount; index++) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
  }
}

function hash(string, len = 8) {
  return string
    .split("")
    .reduce((hash, char) => {
      return char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
    }, 0)
    .toString()
    .substring(1, len + 1);
}

// Function to check if device is mobile
function isMobileDevice() {
  return window.innerWidth <= 768;
}

function show_all_configs() {
  const tbody = document.querySelector("tbody");
  const isMobile = isMobileDevice();

  if (isMobile) {
    document.getElementsByTagName("th")[2].innerHTML = "Config Hash";
  }

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  configLines.forEach((proxyLink, index) => {
    if (!proxyLink.trim()) return;
    if (proxyLink.indexOf("#") === 0) return;

    let link = proxyLink;
    const lengthLimit = 50; // Shorter limit for mobile
    const protocol = proxyLink.substring(0, proxyLink.indexOf(":"));
    const length = proxyLink.length;
    if (length > lengthLimit) {
      if (isMobile) {
        link = hash(proxyLink, 8);
      } else {
        link = proxyLink.substring(0, lengthLimit) + "...";
      }
    }

    const tr = document.createElement("tr");
    const trContent = `
                  <td>${index}</td>
                  <td>${protocol}</td>
                  <td>${link}</td>
                  <td class="warning bx-flashing-v2" id="conf${index}"> --- </td>
                  <td class="primary clickable" onClick="copyText('${proxyLink}')">Copy</td>
      `;
    tr.innerHTML = trContent;
    document.querySelector("table tbody").appendChild(tr);
    tester.updateConfigPing(proxyLink, index);
  });
}

function get_configs(isBase64 = false) {
  const tbody = document.querySelector("tbody");
  const isMobile = isMobileDevice();

  if (isMobile) {
    document.getElementsByTagName("th")[2].innerHTML = "Config Hash";
  }

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  fetch(sub_url)
    .then((response) => response.text())
    .then((text) => {
      let lines = "";
      if (isBase64) {
        lines = atob(text).split("\n");
      } else {
        lines = text.split("\n");
      }

      const table = document.getElementById("proxy-table");
      lines = lines.slice(5, lines.length);
      shuffle(lines, 2);

      configLines = lines;

      lines = lines.slice(0, 10);
      lines.forEach((proxyLink, index) => {
        if (!proxyLink.trim()) return;
        if (proxyLink.indexOf("#") === 0) return;

        let link = proxyLink;
        const lengthLimit = 50; // Shorter limit for mobile
        const protocol = proxyLink.substring(0, proxyLink.indexOf(":"));
        const length = proxyLink.length;
        if (length > lengthLimit) {
          if (isMobile) {
            link = hash(proxyLink, 8);
          } else {
            link = proxyLink.substring(0, lengthLimit) + "...";
          }
        }

        const tr = document.createElement("tr");
        const trContent = `
                  <td>${index}</td>
                  <td>${protocol}</td>
                  <td>${link}</td>
                  <td class="warning bx-flashing-v2" id="conf${index}"> --- </td>
                  <td class="primary clickable" onClick="copyText('${proxyLink}')">Copy</td>
      `;
        tr.innerHTML = trContent;
        document.querySelector("table tbody").appendChild(tr);
        tester.updateConfigPing(proxyLink, index);
      });

      document.querySelectorAll(".link-preview").forEach((linkPreview) => {
        linkPreview.addEventListener("click", () => {
          const linkToCopy = linkPreview.getAttribute("data-link");
          copyText(linkToCopy);
        });
      });

      document.querySelector(".total-count").innerHTML = `
        <div style="font-size: x-small; display: inline">(${configLines.length})</div>
      `;
    })
    .catch((error) => {
      //  console.error(error);
    });
}

// Rest of the code remains the same...
function get_contributors() {
  const contributors = document.querySelector("#contributors");
  var x = "";
  fetch(contributors_url)
    .then((response) => response.json())
    .then((data) => {
      contrib_list = data;
      if (contrib_list.length > 3) {
        contrib_list = data.slice(0, 3);
      }
      data.forEach((contributor, index) => {
        x += `
        <div class="item online">
          <a href="${contributor.html_url}" target="_blank">
          <img
            src="${contributor.avatar_url}"
            alt="${contributor.login}"
            style="width: 3rem; border-radius: 20%"
          />
          </a>
          <div class="right">
            <div class="info">
              <h3><a href="${contributor.html_url}" target="_blank">${contributor.login}</a></h3>
              <small class="text-muted">Contributions: ${contributor.contributions}</small>
            </div>
          </div>
        </div>
        `;
      });

      contributors.innerHTML = x;
    })
    .catch((error) => {
      // console.error(error);
    });
}

//SIDE BAR FUNCTION
const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const refresh_btn = document.querySelector("#refresh-list");
const refresh_i = document.querySelector("#refresh-i");
const show_all = document.querySelector("#show_all");
const scroll_bottom = document.querySelector("#scroll-to-bottom");

//show sidebar
menuBtn.addEventListener("click", function () {
  sideMenu.style.display = "block";
});

//hide sidebar
closeBtn.addEventListener("click", function () {
  sideMenu.style.display = "none";
});

scroll_bottom.addEventListener("click", function () {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
});
