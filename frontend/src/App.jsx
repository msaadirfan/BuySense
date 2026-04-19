// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'        // adjust paths
import Register from './pages/auth/Register'  // to match yours
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/"         element={<Navigate to="/login" />} />

        {/* Protected Routes */}
         <Route path="/dashboard" element={
          <ProtectedRoute>
            
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App