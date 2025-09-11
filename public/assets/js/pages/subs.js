sub_url =
  "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/v2ray/all_sub.txt";

function get_subs_list() {
  const subs_count = 39;
  for (let index = 1; index <= subs_count; index++) {
    const tr = document.createElement("tr");
    const trContent = `
    <tr>
      <td>${index}</td>
      <!-- <td>random</td> -->
      <td class="textToCopy" onClick="copyText('https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/v2ray/subs/sub${index}.txt')">
      ${
        isMobileDevice()
          ? `.../subscriptions/v2ray/subs/sub${index}.txt`
          : `https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/v2ray/subs/sub${index}.txt`
      }
      </td>
      <td class="primary clickable" onClick="copyText('https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/v2ray/subs/sub${index}.txt')">Copy</td>
    </tr>                
    `;
    tr.innerHTML = trContent;
    document.querySelector("table tbody").appendChild(tr);
  }

  document.querySelector(".total-count").innerHTML = `
        <div style="font-size: x-small; display: inline">(${subs_count})</div>
    `;
}

get_subs_list();
get_contributors();
