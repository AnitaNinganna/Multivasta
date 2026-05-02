import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleSubmit = async (formData) => {
    try {
      await login({ email: formData.email, password: formData.password });
      navigate('/products');
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  return <AuthLayout isLogin={true} onSubmit={handleSubmit} loading={loading} error={error} />;
}
