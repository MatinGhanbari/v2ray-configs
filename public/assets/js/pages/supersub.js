sub_url =
  "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/v2ray/super-sub.txt";

get_configs((isBase64 = false));
get_contributors();

refresh_btn.addEventListener("click", function () {
  refresh_i.classList.add("bx-spin");
  get_configs((isBase64 = false));
  setTimeout(() => {
    refresh_i.classList.remove("bx-spin");
  }, 1000);
});

show_all?.addEventListener("click", function () {
  if (
    show_all.innerHTML.trim() ===
    `<i class="bx bx-up-arrow-alt bx-fade-up"></i>&nbsp;&nbsp;Show
              Less&nbsp;&nbsp;<i class="bx bx-up-arrow-alt bx-fade-up"></i>`
  ) {
    get_configs(false);
    show_all.innerHTML = `
    <i class="bx bx-down-arrow-alt bx-fade-down"></i>&nbsp;&nbsp;Show
              All&nbsp;&nbsp;<i
                class="bx bx-down-arrow-alt bx-fade-down"
              ></i>
    `;
  } else {
    show_all_configs();
    show_all.innerHTML = `
    <i class="bx bx-up-arrow-alt bx-fade-up"></i>&nbsp;&nbsp;Show
              Less&nbsp;&nbsp;<i
                class="bx bx-up-arrow-alt bx-fade-up"
              ></i>
    `;
  }
});

const sub = document.querySelector(".sub");
if (isMobileDevice()) {
  sub.innerHTML += `
  <div class="sub-title" style="width: 30%">♾️ SubLink :</div>
  <div
    class="sub-link"
    onclick="copyText('${sub_url}')"
  >
    .../subscriptions/v2ray/super-sub.txt
  </div>
`;
} else {
  sub.innerHTML += `
  <div class="sub-title">♾️ SubLink :</div>
  <div
    class="sub-link"
    onclick="copyText('${sub_url}')"
  >
    ${sub_url}
  </div>
`;
}
