import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import AddListing from './pages/AddListing';
import ListingDetail from './pages/ListingDetail';
import Inbox from './pages/Inbox';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/add-listing" element={<AddListing />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

    </Router>
  );
}

export default App;
