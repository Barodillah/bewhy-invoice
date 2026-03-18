### 1. Skema Database (SQL)

Struktur ini memisahkan data header (nomor dokumen, status) dengan data detail (item barang/jasa) agar satu dokumen bisa memiliki banyak baris item.

```sql

-- 1. Tabel Klien
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Utama Dokumen (Quotation & Invoice)
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    doc_number VARCHAR(50) UNIQUE NOT NULL, -- Contoh: QUO-001 atau INV-001
    type ENUM('Quotation', 'Invoice') NOT NULL,
    status ENUM('Draft', 'Sent', 'Revised', 'Approved', 'Invoiced', 'Paid', 'Completed', 'Cancelled') DEFAULT 'Draft',
    issue_date DATE NOT NULL,
    due_date DATE,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00, -- Persentase pajak jika ada
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 3. Tabel Item (Barang/Jasa yang ditawarkan)
CREATE TABLE document_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT,
    description TEXT NOT NULL,
    qty INT DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 4. Tabel Labor Costs (Biaya Tenaga Kerja Terpisah)
CREATE TABLE labor_costs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT,
    description TEXT NOT NULL,
    cost DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```
