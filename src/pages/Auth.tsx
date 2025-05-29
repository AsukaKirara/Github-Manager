import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toaster';

const Auth: React.FC = () => {
  const { isAuthenticated, isInitialized, login, initialize } = useAuth();
  const { addToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isInitialized) {
        if (password.length < 8) {
          addToast({
            title: 'Invalid password',
            description: 'Password must be at least 8 characters long',
            type: 'error',
          });
          return;
        }

        if (password !== confirmPassword) {
          addToast({
            title: 'Passwords do not match',
            description: 'Please ensure both passwords are identical',
            type: 'error',
          });
          return;
        }

        await initialize(password);
        addToast({
          title: 'Password set successfully',
          description: 'You can now log in with your password',
          type: 'success',
        });
      } else {
        const success = await login(password);
        if (!success) {
          addToast({
            title: 'Login failed',
            description: 'Invalid password',
            type: 'error',
          });
        }
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {isInitialized ? 'Welcome back!' : 'Set up your password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isInitialized
              ? 'Enter your password to access the GitHub Account Manager'
              : 'Create a password to protect your GitHub accounts'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                placeholder="Password"
              />
            </div>

            {!isInitialized && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                  placeholder="Confirm Password"
                />
              </div>
            )}
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center"
              disabled={isLoading}
            >
              <Key className="h-4 w-4 mr-2" />
              {isLoading
                ? 'Processing...'
                : isInitialized
                ? 'Sign In'
                : 'Set Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;