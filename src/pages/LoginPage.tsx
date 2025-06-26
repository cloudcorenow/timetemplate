import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Calendar, Eye, EyeOff } from 'lucide-react';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both email and password'
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        addToast({
          type: 'success',
          title: 'Welcome Back!',
          message: 'You have been successfully logged in.'
        });
        navigate('/');
      } else {
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid email or password. Please check your credentials and try again.'
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Login Error',
        message: 'An error occurred during login. Please try again.'
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground className="flex min-h-screen flex-col">
      <div className="mx-auto mt-8 w-full max-w-md px-4 sm:px-0">
        <div className="flex flex-col items-center justify-center animate-fade-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
            <Calendar size={40} />
          </div>
          <h2 className="mb-2 text-center text-4xl font-bold tracking-tight text-gray-900">
            TimeOff Manager
          </h2>
          <p className="text-center text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl animate-scale-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full py-3"
              size="lg"
            >
              Sign in
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 TimeOff Manager. Built with modern web technologies.
          </p>
        </div>
      </div>
    </GradientBackground>
  );
};

export default LoginPage;