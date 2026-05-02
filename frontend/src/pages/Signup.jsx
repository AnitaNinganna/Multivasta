import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading, error } = useAuth();

  const handleSubmit = async (formData) => {
    try {
      const payload = {
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role || 'customer',
      };

      if (formData.role === 'vendor') {
        payload.store_name = formData.storeName;
      }

      await signup(payload);
      navigate('/products');
    } catch (err) {
      console.error('Signup failed:', err);
      throw err;
    }
  };

  return <AuthLayout isLogin={false} onSubmit={handleSubmit} loading={loading} error={error} />;
}
