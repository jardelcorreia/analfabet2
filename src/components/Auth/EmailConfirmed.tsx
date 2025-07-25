import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';

export const EmailConfirmed: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-yellow-400 dark:from-gray-800 dark:via-gray-900 dark:to-black flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <MailCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Confirmado!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Seu email foi confirmado com sucesso. Agora você pode fazer login na sua conta.
        </p>
        <Link
          to="/login"
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
        >
          Ir para o Login
        </Link>
      </div>
    </div>
  );
};
