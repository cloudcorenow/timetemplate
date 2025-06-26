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
          message: 'Invalid email or password. Please use the demo credentials below.'
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

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    addToast({
      type: 'info',
      title: 'Demo Account Selected',
      message: `Using ${demoEmail} for demonstration`
    });
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

            <Button
              type="submit"
              loading={isLoading}
              className="w-full py-3"
              size="lg"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500 font-medium">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('employee@example.com')}
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              >
                <span className="mr-2 text-lg">👤</span>
                Employee Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('manager@example.com')}
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              >
                <span className="mr-2 text-lg">👔</span>
                Manager Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('it@sapphiremfg.com')}
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              >
                <span className="mr-2 text-lg">🔧</span>
                Admin Demo
              </button>
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
              <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</p>
              <p className="text-xs text-blue-700">
                Email: Any of the demo emails above<br />
                Password: <code className="bg-blue-100 px-1 rounded font-mono">password</code>
              </p>
            </div>
          </div>
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