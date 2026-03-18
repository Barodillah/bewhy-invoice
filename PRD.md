## PRD: Bewhy Invoice & Quotation System

### 1. Ringkasan Proyek
Aplikasi berbasis web untuk mengelola siklus hidup transaksi dari penawaran (*Quotation*) hingga penagihan (*Invoice*). Fokus utama adalah kemudahan input data, perhitungan otomatis, dan ekspor dokumen PDF yang elegan.

### 2. Status Workflow (Saran Alur)
Untuk menjaga pelacakan yang rapi, berikut adalah usulan status dari awal hingga akhir:

| Status | Deskripsi |
| :--- | :--- |
| **Draft** | Dokumen sedang dibuat, belum siap dikirim ke klien. |
| **Sent** | Penawaran sudah dikirim ke klien (menunggu respon). |
| **Revised** | Penawaran sedang dalam proses revisi berdasarkan *feedback*. |
| **Approved** | Klien setuju. Dokumen siap dikonversi menjadi Invoice. |
| **Invoiced** | Pekerjaan berjalan dan tagihan sudah diterbitkan. |
| **Paid** | Pembayaran telah diterima secara penuh. |
| **Completed** | Proyek selesai dan semua administrasi beres. |
| **Cancelled** | Penawaran atau invoice dibatalkan. |

---

### 3. Fitur Utama

#### A. Manajemen Penawaran (Quotation)
* **Form Input Dinamis:** Menambah baris item tanpa batas (Nama Item, Deskripsi, Qty, Unit Price).
* **Labor Cost Module:** Input biaya jasa/tenaga kerja secara terpisah.
* **Auto-Calculation:** Menghitung otomatis Subtotal, Diskon (persentase/nominal), dan Total Akhir.
* **Convert to Invoice:** Tombol sekali klik untuk mengubah penawaran yang "Approved" menjadi Invoice tanpa input ulang.

#### B. Manajemen Invoice
* **Penomoran Otomatis:** Format custom (Contoh: `INV/BEWHY/2026/001`).
* **Due Date:** Pengaturan tanggal jatuh tempo pembayaran.
* **Payment Status:** Penanda apakah tagihan sudah dibayar atau belum.

#### C. Custom PDF Engine
* **Template Branding:** Header dengan logo PT Bahasa Yoedhistira Digital, watermark, dan tanda tangan digital/stempel perusahaan.
* **Print-ready:** Layout yang rapi saat disimpan sebagai PDF atau dicetak langsung.

---

### 4. Spesifikasi Teknis

* **Frontend:** React.js (dengan **Tailwind CSS** untuk tampilan *clean* dan profesional).
* **Backend:** PHP (Native atau Slim Framework) sebagai API penengah.
* **Database:** MySQL.
* **PDF Library:** `jsPDF` atau `react-pdf` di sisi frontend, atau `Dompdf` jika ingin di-generate di sisi backend PHP.

---

### 5. Arsitektur Database (Tabel Utama)

1.  **`clients`**: Nama perusahaan, alamat, email, PIC.
2.  **`documents`**: ID, Type (Quotation/Invoice), Nomor Dokumen, Status, Tanggal, Diskon, Total, Client_ID.
3.  **`document_items`**: Deskripsi barang/jasa, Qty, Harga Satuan, Total per item.
4.  **`labor_costs`**: Deskripsi jasa, Biaya.

---

### 6. Panduan UI/UX (Clean Professional)
* **Warna:** Gunakan palet profesional (Navy Blue, Slate Gray, dan Putih Bersih).
* **Tipografi:** Gunakan font Sans-serif yang modern seperti *Inter* atau *Roboto*.
* **Dashboard:** Menampilkan ringkasan jumlah penawaran yang masih "Sent" dan invoice yang belum dibayar (*Outstanding*).

---

> **Tips Tambahan:** Karena Anda menggunakan React, pastikan untuk menggunakan *State Management* (seperti `useState` atau `useReducer`) yang kuat untuk menangani form input item penawaran yang dinamis agar pengalaman pengguna terasa *seamless* tanpa *reload* halaman.
