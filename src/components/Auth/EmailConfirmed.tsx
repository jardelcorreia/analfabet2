import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';

export const EmailConfirmed: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <MailCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-card-foreground mb-2">Email Confirmado!</h1>
        <p className="text-muted-foreground mb-6">
          Seu email foi confirmado com sucesso. Agora você pode fazer login na sua conta.
        </p>
        <Link
          to="/login"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
        >
          Ir para o Login
        </Link>
      </div>
    </div>
  );
};
