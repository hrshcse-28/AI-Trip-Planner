import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ExploreIndia from './pages/ExploreIndia';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import TripDetails from './pages/TripDetails';
import Profile from './pages/Profile';
import PublicTrip from './pages/PublicTrip';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="explore-india" element={<ExploreIndia />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="share/:id" element={<PublicTrip />} />
                <Route path="dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="create-trip" element={
                  <ProtectedRoute><CreateTrip /></ProtectedRoute>
                } />
                <Route path="my-trips" element={
                  <ProtectedRoute><MyTrips /></ProtectedRoute>
                } />
                <Route path="trip/:id" element={
                  <ProtectedRoute><TripDetails /></ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
