import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MarketplacePage from '@/pages/MarketplacePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { useAppDispatch } from '@/store/hooks';
import { hydrate } from '@/features/auth/authSlice';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(hydrate());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<MarketplacePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
