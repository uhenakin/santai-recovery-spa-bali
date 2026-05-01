(function () {
    "use strict";
    const API_URL = "/track";
    const STORAGE_KEY = "santai_debug_v4";

    // Fungsi kirim data yang sangat simpel
    async function sendData(clickType) {
        console.log(">>> MENGIRIM KLIK:", clickType);
        try {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: clickType }),
                keepalive: true
            });
        } catch (e) { console.error("Gagal kirim:", e); }
    }

    document.addEventListener("click", function (e) {
        const anchor = e.target.closest("a");
        if (!anchor) return;

        const href = anchor.getAttribute("href") || "";
        const text = anchor.innerText.toLowerCase();
        let type = null;

        // DETEKSI SAPU JAGAT (Berdasarkan link ATAU teks tombol)
        if (/wa\.me|whatsapp|api\.whatsapp|wa\.link|628/i.test(href) || /whatsapp|wa|chat/i.test(text)) {
            type = "whatsapp";
        } else if (/instagram\.com|ig\.me/i.test(href) || /instagram|ig/i.test(text)) {
            type = "instagram";
        } else if (/maps|goo\.gl|google.*maps|location|lokasi/i.test(href) || /maps|lokasi|alamat/i.test(text)) {
            type = "maps";
        } else if (/mailto:/i.test(href) || /email|surat/i.test(text)) {
            type = "email";
        }

        if (type) {
            console.log(">>> TOMBOL TERDETEKSI:", type);
            // Kita bypass cooldown dulu untuk testing supaya pasti masuk
            sendData(type);
        }
    }, true);

    console.log(">>> TRACKER SAPU JAGAT AKTIF");
})();
