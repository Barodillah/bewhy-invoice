import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Dashboard from './pages/Dashboard';
import QuotationsList from './pages/QuotationsList';
import QuotationCreate from './pages/QuotationCreate';
import QuotationDetail from './pages/QuotationDetail';
import QuotationEdit from './pages/QuotationEdit';
import InvoicesList from './pages/InvoicesList';
import InvoiceDetail from './pages/InvoiceDetail';
import ClientsList from './pages/ClientsList';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OTPPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="quotations" element={<QuotationsList />} />
            <Route path="quotations/new" element={<QuotationCreate />} />
            <Route path="quotations/:id" element={<QuotationDetail />} />
            <Route path="quotations/:id/edit" element={<QuotationEdit />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

