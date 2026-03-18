export const initialClients = [
  { id: 1, name: 'PT Tech Solutions', address: 'Jl. Sudirman No. 1, Jakarta', email: 'contact@techsolutions.co.id', pic: 'Budi Santoso' },
  { id: 2, name: 'CV Alpha Creative', address: 'Jl. Merdeka No. 45, Bandung', email: 'hello@alphacreative.com', pic: 'Siti Aminah' },
  { id: 3, name: 'Yasir Travel', address: 'Jl. Thamrin No. 9, Jakarta', email: 'procurement@globalind.com', pic: 'David Lee' },
];

export const initialDocuments = [
  {
    id: 1,
    type: 'Quotation',
    number: '001/QUO/BYD/III/2026',
    status: 'Sent',
    date: '2026-03-01',
    dueDate: null,
    discount: 500000,
    subTotal: 15500000,
    total: 15000000,
    clientId: 1,
    laborCostTotal: 5000000,
    itemsTotal: 10500000,
  },
  {
    id: 2,
    type: 'Invoice',
    number: '001/INV/BYD/III/2026',
    status: 'Invoiced',
    date: '2026-03-10',
    dueDate: '2026-03-24',
    discount: 0,
    subTotal: 8000000,
    total: 8000000,
    clientId: 2,
    laborCostTotal: 0,
    itemsTotal: 8000000,
  },
  {
    id: 3,
    type: 'Quotation',
    number: '002/QUO/BYD/III/2026',
    status: 'Approved',
    date: '2026-03-15',
    dueDate: null,
    discount: 10, // Assuming this means 10% or just handle as nominal for now, let's stick to nominal
    subTotal: 12000000,
    total: 12000000,
    clientId: 3,
    laborCostTotal: 2000000,
    itemsTotal: 10000000,
  }
];

export const initialDocumentItems = [
  // For Doc 1
  { id: 1, documentId: 1, description: 'Website Development UI/UX', qty: 1, unitPrice: 5000000, total: 5000000 },
  { id: 2, documentId: 1, description: 'Backend API Development', qty: 1, unitPrice: 5500000, total: 5500000 },
  // For Doc 2
  { id: 3, documentId: 2, description: 'Social Media Management (March)', qty: 1, unitPrice: 8000000, total: 8000000 },
  // For Doc 3
  { id: 4, documentId: 3, description: 'Brand Identity Design', qty: 1, unitPrice: 10000000, total: 10000000 },
];

export const initialLaborCosts = [
  // For Doc 1
  { id: 1, documentId: 1, description: 'Project Manager (40hrs)', cost: 2000000 },
  { id: 2, documentId: 1, description: 'Senior Developer (Consulting)', cost: 3000000 },
  // For Doc 3
  { id: 3, documentId: 3, description: 'Art Director Concepting', cost: 2000000 },
];
