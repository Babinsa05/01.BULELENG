const WEBHOOK_CONFIG_URL = "data/webhook.json";
let googleAppsScriptWebhook = "";
let supabaseConfig = null;

async function getSupabaseConfig() {
    if (supabaseConfig) return supabaseConfig;

    const response = await fetch("data/supabase.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Gagal memuat konfigurasi Supabase (HTTP ${response.status})`);
    }

    const config = await response.json();
    if (!config || typeof config.url !== "string" || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url)
        || typeof config.anonKey !== "string" || !config.anonKey.trim()
        || typeof config.table !== "string" || !config.table.trim()
        || typeof config.desaColumn !== "string" || !config.desaColumn.trim()
        || typeof config.monthColumn !== "string" || !config.monthColumn.trim()
        || typeof config.yearColumn !== "string" || !config.yearColumn.trim()
        || typeof config.countColumn !== "string" || !config.countColumn.trim()) {
        throw new Error("Konfigurasi Supabase belum lengkap");
    }

    supabaseConfig = {
        url: config.url.replace(/\/+$/, ""),
        anonKey: config.anonKey.trim(),
        table: config.table.trim(),
        desaColumn: config.desaColumn.trim(),
        monthColumn: config.monthColumn.trim(),
        yearColumn: config.yearColumn.trim(),
        countColumn: config.countColumn.trim()
    };
    return supabaseConfig;
}

async function getAttendanceCount(desaName = "") {
    if (!desaName || !desaName.trim()) {
        throw new Error("Desa/kelurahan belum dipilih");
    }

    const config = await getSupabaseConfig();
    const today = new Date();
    const params = new URLSearchParams({
        select: config.countColumn,
        [config.desaColumn]: `eq.${desaName.trim()}`,
        [config.monthColumn]: `eq.${today.getMonth() + 1}`,
        [config.yearColumn]: `eq.${today.getFullYear()}`
    });

    const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}?${params.toString()}`, {
        method: "GET",
        headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
            Accept: "application/json"
        }
    });
    if (!response.ok) {
        throw new Error(`Gagal membaca data absensi (HTTP ${response.status})`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length > 1) {
        throw new Error("Data absensi memiliki rekap ganda untuk periode yang sama");
    }
    const count = rows.length === 0 ? 0 : Number(rows[0][config.countColumn]);
    if (!Number.isInteger(count) || count < 0) {
        throw new Error("Supabase tidak mengembalikan jumlah laporan yang valid");
    }
    return count;
}

async function recordAttendance(desaName, reportDate = new Date()) {
    if (!desaName || !desaName.trim()) {
        throw new Error("Desa/kelurahan belum dipilih");
    }

    const config = await getSupabaseConfig();
    const date = reportDate instanceof Date ? reportDate : new Date(reportDate);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Tanggal laporan tidak valid");
    }

    const period = {
        desa: desaName.trim(),
        bulan: date.getMonth() + 1,
        tahun: date.getFullYear()
    };
    const filter = new URLSearchParams({
        [config.desaColumn]: `eq.${period.desa}`,
        [config.monthColumn]: `eq.${period.bulan}`,
        [config.yearColumn]: `eq.${period.tahun}`,
        select: config.countColumn
    });
    const headers = {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Accept: "application/json"
    };
    const currentResponse = await fetch(
        `${config.url}/rest/v1/${encodeURIComponent(config.table)}?${filter.toString()}`,
        { headers }
    );
    if (!currentResponse.ok) {
        throw new Error(`Gagal membaca rekap absensi (HTTP ${currentResponse.status})`);
    }

    const currentRows = await currentResponse.json();
    if (!Array.isArray(currentRows) || currentRows.length > 1) {
        throw new Error("Data absensi memiliki rekap ganda untuk periode yang sama");
    }
    const currentCount = currentRows.length === 0 ? 0 : Number(currentRows[0][config.countColumn]);
    if (!Number.isInteger(currentCount) || currentCount < 0) {
        throw new Error("Jumlah laporan pada Supabase tidak valid");
    }

    const payload = {
        [config.desaColumn]: period.desa,
        [config.monthColumn]: period.bulan,
        [config.yearColumn]: period.tahun,
        [config.countColumn]: currentCount + 1
    };
    const saveResponse = await fetch(
        `${config.url}/rest/v1/${encodeURIComponent(config.table)}`,
        {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
                Prefer: "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify(payload)
        }
    );
    if (!saveResponse.ok) {
        throw new Error(`Gagal menyimpan absensi (HTTP ${saveResponse.status})`);
    }
    return payload[config.countColumn];
}

async function getGoogleAppsScriptWebhook() {
    if (googleAppsScriptWebhook) return googleAppsScriptWebhook;
    const response = await fetch(WEBHOOK_CONFIG_URL, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Gagal memuat konfigurasi webhook (HTTP ${response.status})`);
    }
    const config = await response.json();
    if (typeof config.webhookUrl !== "string" ||
        !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(config.webhookUrl)) {
        throw new Error("URL webhook belum dikonfigurasi");
    }
    googleAppsScriptWebhook = config.webhookUrl;
    return googleAppsScriptWebhook;
}

async function sendToBackend(action, data = {}) {
    const allowedActions = ["uploadDrive"];
    if (!allowedActions.includes(action)) {
        throw new Error(`Action "${action}" tidak tersedia`);
    }

    const formData = new FormData();
    formData.append("action", action);
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, String(data[key]));
        }
    });

    const response = await fetch(await getGoogleAppsScriptWebhook(), {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Backend gagal (HTTP ${response.status})`);
    }

    return response.json();
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Gagal membaca file laporan"));
                return;
            }
            resolve(result.split(",")[1]);
        };
        reader.onerror = () => reject(new Error("Gagal membaca file laporan"));
        reader.readAsDataURL(blob);
    });
}

async function uploadToGoogleDrive(zipBlob, zipFileName, desaName, date) {
    const regionType = /^kelurahan\b/i.test(desaName) ? "Kelurahan" : "Desa";
    const month = date.toLocaleDateString("id-ID", { month: "long" });
    const year = String(date.getFullYear());
    const result = await sendToBackend("uploadDrive", {
        fileName: zipFileName,
        zipFileName,
        desaName,
        wilayah: desaName,
        regionType,
        folderName: desaName,
        fileData: await blobToBase64(zipBlob),
        year,
        month,
        folderPath: `${regionType}/${desaName}/${year}/${month}`,
        desa: desaName,
        mimeType: "application/zip"
    });
    return result.success === true;
}

window.sendToBackend = sendToBackend;
window.uploadToGoogleDrive = uploadToGoogleDrive;
window.getAttendanceCount = getAttendanceCount;
window.recordAttendance = recordAttendance;
