import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import AddListing from './pages/AddListing';
import ListingDetail from './pages/ListingDetail';
import Inbox from './pages/Inbox';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
        <Route path="/listing/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>

    </Router>
  );
}

export default App;
