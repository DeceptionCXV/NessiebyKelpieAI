import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NessieQueue } from './pages/NessieQueue';
import { CreateBatchPage } from './pages/CreateBatchPage';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/queue" 
          element={
            <ProtectedRoute>
              <NessieQueue />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/queue/new" 
          element={
            <ProtectedRoute>
              <CreateBatchPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect root to queue */}
        <Route path="/" element={<Navigate to="/queue" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;