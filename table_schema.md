# Database Schema — Bewhy Invoice & Quotation System

Struktur ini memisahkan data header (dokumen) dengan data detail (item, labor, pembayaran, benefit, term) agar satu dokumen bisa memiliki banyak baris relasi.

---

## ERD Overview

```
clients 1──N documents 1──N document_items
                       1──N labor_costs
                       1──N document_benefits
                       1──N document_terms
                       1──N payments
documents (Invoice) N──1 documents (Quotation)  via quotation_id
```

---

## SQL

```sql

-- ============================================
-- 1. CLIENTS
-- ============================================
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pic VARCHAR(255) NOT NULL COMMENT 'Person in Charge',
    email VARCHAR(255),
    address TEXT,
    phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. DOCUMENTS (Quotation & Invoice)
-- ============================================
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    quotation_id INT DEFAULT NULL COMMENT 'Jika type=Invoice, referensi ke Quotation asal (nullable)',
    type ENUM('Quotation', 'Invoice') NOT NULL,
    doc_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'Format: 001/QUO/BYD/III/2026 atau 001/INV/BYD/III/2026',
    status ENUM('Draft', 'Sent', 'Approved', 'Invoiced', 'DP Paid', 'Paid', 'Completed', 'Cancelled') DEFAULT 'Draft',
    issue_date DATE NOT NULL,
    due_date DATE DEFAULT NULL COMMENT 'Wajib untuk Invoice, null untuk Quotation',
    items_total DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total harga item',
    labor_cost_total DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total biaya tenaga kerja',
    sub_total DECIMAL(15,2) DEFAULT 0.00 COMMENT 'items_total + labor_cost_total',
    discount_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Potongan harga (nominal)',
    total_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'sub_total - discount_amount',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (quotation_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- ============================================
-- 3. DOCUMENT ITEMS (Barang / Jasa)
-- ============================================
CREATE TABLE document_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    description TEXT NOT NULL,
    qty INT DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL COMMENT 'qty * unit_price',
    sort_order INT DEFAULT 0 COMMENT 'Urutan tampil item',
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================
-- 4. LABOR COSTS (Biaya Tenaga Kerja)
-- ============================================
CREATE TABLE labor_costs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(15,2) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================
-- 5. DOCUMENT BENEFITS (Keuntungan Quotation)
-- ============================================
CREATE TABLE document_benefits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    description TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================
-- 6. DOCUMENT TERMS (Syarat & Ketentuan)
-- ============================================
CREATE TABLE document_terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    description TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================
-- 7. PAYMENTS (Riwayat Pembayaran Invoice)
-- ============================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    type ENUM('dp', 'full') NOT NULL COMMENT 'dp=Down Payment, full=Pelunasan',
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_quotation ON documents(quotation_id);
CREATE INDEX idx_document_items_doc ON document_items(document_id);
CREATE INDEX idx_labor_costs_doc ON labor_costs(document_id);
CREATE INDEX idx_benefits_doc ON document_benefits(document_id);
CREATE INDEX idx_terms_doc ON document_terms(document_id);
CREATE INDEX idx_payments_doc ON payments(document_id);
```

---

## Penjelasan Relasi

| Relasi | Keterangan |
|---|---|
| `clients` → `documents` | 1 client bisa punya banyak Quotation & Invoice |
| `documents` → `document_items` | 1 dokumen bisa punya banyak item barang/jasa |
| `documents` → `labor_costs` | 1 dokumen bisa punya banyak biaya tenaga kerja |
| `documents` → `document_benefits` | 1 Quotation bisa punya banyak benefit |
| `documents` → `document_terms` | 1 Quotation bisa punya banyak syarat & ketentuan |
| `documents` → `payments` | 1 Invoice bisa punya banyak riwayat pembayaran (DP + pelunasan) |
| `documents.quotation_id` → `documents.id` | Invoice bisa merujuk ke Quotation asal (self-referencing FK) |

---

## Status Flow

```
Quotation:  Draft → Sent → Approved → (Convert to Invoice)
Invoice:    Invoiced → DP Paid → Paid → Completed
                    └──────────→ Paid  (langsung lunas tanpa DP)
```
