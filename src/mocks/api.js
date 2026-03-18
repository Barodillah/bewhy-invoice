import { initialClients, initialDocuments, initialDocumentItems, initialLaborCosts } from './mockData';

// Simulate a database
let db = {
  clients: [...initialClients],
  documents: [...initialDocuments],
  documentItems: [...initialDocumentItems],
  laborCosts: [...initialLaborCosts]
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- Clients ---
  getClients: async () => {
    await delay(300);
    return [...db.clients];
  },

  // --- Documents (Quotations & Invoices) ---
  getDocuments: async (type = null) => {
    await delay(300);
    if (type) {
      return db.documents.filter(doc => doc.type === type).map(doc => ({
        ...doc,
        client: db.clients.find(c => c.id === doc.clientId)
      }));
    }
    return db.documents.map(doc => ({
      ...doc,
      client: db.clients.find(c => c.id === doc.clientId)
    }));
  },

  getDocumentById: async (id) => {
    await delay(300);
    const doc = db.documents.find(d => d.id === parseInt(id));
    if (!doc) return null;

    const items = db.documentItems.filter(item => item.documentId === doc.id);
    const laborCosts = db.laborCosts.filter(lc => lc.documentId === doc.id);
    const client = db.clients.find(c => c.id === doc.clientId);

    return { ...doc, items, laborCosts, client };
  },

  createDocument: async (documentData, itemsData, laborCostsData) => {
    await delay(500);
    
    // Generate new ID
    const newDocId = db.documents.length > 0 ? Math.max(...db.documents.map(d => d.id)) + 1 : 1;
    
    // Create new document
    const newDoc = {
      ...documentData,
      id: newDocId
    };
    db.documents.push(newDoc);

    // Create items
    let newItemId = db.documentItems.length > 0 ? Math.max(...db.documentItems.map(i => i.id)) + 1 : 1;
    itemsData.forEach(item => {
      db.documentItems.push({ ...item, id: newItemId++, documentId: newDocId });
    });

    // Create labor costs
    let newLaborId = db.laborCosts.length > 0 ? Math.max(...db.laborCosts.map(l => l.id)) + 1 : 1;
    if (laborCostsData && laborCostsData.length > 0) {
      laborCostsData.forEach(lc => {
        db.laborCosts.push({ ...lc, id: newLaborId++, documentId: newDocId });
      });
    }

    return newDoc;
  },

  updateDocument: async (id, documentData, itemsData, laborCostsData) => {
    await delay(300);
    const docIndex = db.documents.findIndex(d => d.id === parseInt(id));
    if (docIndex === -1) throw new Error('Document not found');

    // Update document fields
    db.documents[docIndex] = { ...db.documents[docIndex], ...documentData };

    // Replace items
    db.documentItems = db.documentItems.filter(item => item.documentId !== parseInt(id));
    let newItemId = db.documentItems.length > 0 ? Math.max(...db.documentItems.map(i => i.id)) + 1 : 1;
    itemsData.forEach(item => {
      db.documentItems.push({ ...item, id: newItemId++, documentId: parseInt(id) });
    });

    // Replace labor costs
    db.laborCosts = db.laborCosts.filter(lc => lc.documentId !== parseInt(id));
    let newLaborId = db.laborCosts.length > 0 ? Math.max(...db.laborCosts.map(l => l.id)) + 1 : 1;
    if (laborCostsData && laborCostsData.length > 0) {
      laborCostsData.forEach(lc => {
        db.laborCosts.push({ ...lc, id: newLaborId++, documentId: parseInt(id) });
      });
    }

    return db.documents[docIndex];
  },

  updateDocumentStatus: async (id, newStatus) => {
    await delay(300);
    const docIndex = db.documents.findIndex(d => d.id === parseInt(id));
    if (docIndex !== -1) {
      db.documents[docIndex] = { ...db.documents[docIndex], status: newStatus };
      return db.documents[docIndex];
    }
    throw new Error('Document not found');
  },

  addPayment: async (id, paymentData) => {
    await delay(300);
    const docIndex = db.documents.findIndex(d => d.id === parseInt(id));
    if (docIndex === -1) throw new Error('Document not found');

    const doc = db.documents[docIndex];
    if (!doc.payments) doc.payments = [];
    doc.payments.push({
      id: Date.now(),
      ...paymentData,
      date: paymentData.date || new Date().toISOString().split('T')[0],
    });

    // Update status based on payment type
    if (paymentData.type === 'full') {
      doc.status = 'Paid';
    } else if (paymentData.type === 'dp') {
      doc.status = 'DP Paid';
    }

    db.documents[docIndex] = doc;
    return doc;
  },

  // Helper function to calculate totals for a document
  calculateTotals: (items, laborCosts, discount = 0) => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const laborCostTotal = laborCosts ? laborCosts.reduce((sum, lc) => sum + lc.cost, 0) : 0;
    const subTotal = itemsTotal + laborCostTotal;
    const total = subTotal - discount; // Simple nominal discount for now
    return { itemsTotal, laborCostTotal, subTotal, total };
  },

  // --- Client CRUD ---
  createClient: async (clientData) => {
    await delay(300);
    const newId = db.clients.length > 0 ? Math.max(...db.clients.map(c => c.id)) + 1 : 1;
    const newClient = { ...clientData, id: newId };
    db.clients.push(newClient);
    return newClient;
  },

  updateClient: async (id, clientData) => {
    await delay(300);
    const index = db.clients.findIndex(c => c.id === parseInt(id));
    if (index !== -1) {
      db.clients[index] = { ...db.clients[index], ...clientData };
      return db.clients[index];
    }
    throw new Error('Client not found');
  },

  deleteClient: async (id) => {
    await delay(300);
    const index = db.clients.findIndex(c => c.id === parseInt(id));
    if (index !== -1) {
      db.clients.splice(index, 1);
      return true;
    }
    throw new Error('Client not found');
  }
};
