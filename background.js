chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "detectAIImage",
    title: "Cek apakah foto ini AI?",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "detectAIImage") {
    const imageUrl = info.srcUrl;
    console.log("URL Gambar yang dipilih:", imageUrl);
    
    // 1. Tampilkan Kotak Loading (Floating Card) di Halaman Web
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Hapus card lama jika ada
        const existing = document.getElementById("ai-detector-card");
        if (existing) existing.remove();

        // Buat elemen card baru untuk loading
        const card = document.createElement("div");
        card.id = "ai-detector-card";
        card.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999999;
          background: #1e1e2f;
          color: #fff;
          padding: 15px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          font-family: Arial, sans-serif;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 5px solid #6366f1;
          animation: fadeIn 0.3s ease-in-out;
        `;
        card.innerHTML = `
          <div style="width: 18px; height: 18px; border: 3px solid #ccc; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <div>
            <div style="font-weight: bold; margin-bottom: 2px;">AI Image Detector</div>
            <div style="color: #cbd5e1; font-size: 12px;">Sedang menganalisis gambar...</div>
          </div>
        `;
        
        // Tambahkan animasi CSS mutar untuk spinner
        const style = document.createElement("style");
        style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
        document.body.appendChild(card);
      }
    });

    // 2. Kirim URL ke Server Python Flask
    fetch("http://localhost:5000/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageUrl: imageUrl })
    })
    .then(response => response.json())
    .then(data => {
      // 3. Perbarui Floating Card dengan Hasil Deteksi dari Server
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (pesan) => {
          const card = document.getElementById("ai-detector-card");
          if (card) {
            // Tentukan warna border berdasarkan hasil (misal: merah jika AI, hijau jika asli)
            const isAI = pesan.includes("Buatan AI");
            card.style.borderLeftColor = isAI ? "#ef4444" : "#22c55e";
            
            card.innerHTML = `
              <div style="flex-grow: 1;">
                <div style="font-weight: bold; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <span>Hasil Deteksi AI</span>
                  <button id="close-ai-card" style="background:none; border:none; color:#aaa; cursor:pointer; font-size:16px;">&times;</button>
                </div>
                <div style="color: #f8fafc; font-size: 13px; line-height: 1.4;">${pesan}</div>
              </div>
            `;
            
            document.getElementById("close-ai-card").onclick = () => card.remove();
            
            // Otomatis hilang setelah 7 detik
            setTimeout(() => {
              if (card) card.remove();
            }, 7000);
          }
        },
        args: [data.message]
      });
    })
    .catch(error => {
      console.error("Error:", error);
      // Tampilkan error jika gagal terhubung ke server
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const card = document.getElementById("ai-detector-card");
          if (card) {
            card.style.borderLeftColor = "#f59e0b";
            card.innerHTML = `
              <div style="flex-grow: 1;">
                <div style="font-weight: bold; margin-bottom: 4px;">Gagal Terhubung</div>
                <div style="color: #cbd5e1; font-size: 12px;">Pastikan server.py menyala!</div>
              </div>
            `;
            setTimeout(() => card.remove(), 5000);
          }
        }
      });
    });
  }
});