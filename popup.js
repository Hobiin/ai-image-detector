document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get({ detectionHistory: [] }, (data) => {
      const listContainer = document.getElementById("history-list");
      const history = data.detectionHistory;
  
      if (history.length === 0) {
        listContainer.innerHTML = `<div class="empty">Belum ada riwayat pengecekan.</div>`;
        return;
      }
  
      listContainer.innerHTML = "";
      // Tampilkan dari yang paling baru
      history.reverse().forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        const isAI = item.message.includes("Buatan AI");
        const color = isAI ? "#ef4444" : "#22c55e";
  
        div.innerHTML = `
          <img src="${item.imageUrl}" alt="img">
          <div class="details">
            <div class="res" style="color: ${color};">${item.message}</div>
            <div class="url">${item.imageUrl}</div>
          </div>
        `;
        listContainer.appendChild(div);
      });
    });
  });