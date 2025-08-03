import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Trophy, Users, BarChart2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const heroImageUrl = 'https://images.unsplash.com/photo-1626292730004-0b3373283151';

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Hero Section */}
      <header
        className="relative bg-cover bg-center h-[60vh] min-h-[400px] flex items-center justify-center text-white"
        style={{ backgroundImage: `url(${heroImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center p-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-shadow-lg">
            AnalfaBet
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-shadow">
            A liga de apostas do Brasileirão para você e seus amigos. Crie sua liga, dê seus palpites e dispute pela glória!
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105"
            >
              Começar Agora
            </Link>
            <Link
              to="/login"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full transition duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16 sm:py-24">
        {/* Features Section */}
        <section className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-2">Como Funciona?</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">É simples e rápido. Siga os passos abaixo e comece a competir!</p>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="p-6">
              <Users className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">1. Crie sua Conta</h3>
              <p className="text-gray-600 dark:text-gray-400">Registre-se em segundos e prepare-se para a ação.</p>
            </div>
            <div className="p-6">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">2. Crie ou Entre em uma Liga</h3>
              <p className="text-gray-600 dark:text-gray-400">Crie sua própria liga privada ou junte-se a uma existente com um código.</p>
            </div>
            <div className="p-6">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">3. Dê seus Palpites</h3>
              <p className="text-gray-600 dark:text-gray-400">Aposte nos resultados dos jogos do Brasileirão a cada rodada.</p>
            </div>
            <div className="p-6">
              <BarChart2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">4. Acompanhe o Ranking</h3>
              <p className="text-gray-600 dark:text-gray-400">Veja sua posição em tempo real e dispute com seus amigos.</p>
            </div>
          </div>
        </section>

        {/* Scoring System Section */}
        <section className="bg-white dark:bg-gray-800 py-16 sm:py-24 mt-16 sm:mt-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-2">Sistema de Pontuação</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">Entenda como seus palpites viram pontos.</p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
              <div className="bg-green-100 dark:bg-green-900/50 p-8 rounded-xl shadow-md w-full md:w-1/3">
                <h3 className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">3</h3>
                <p className="text-xl font-semibold">Pontos</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Por acertar o placar exato do jogo.</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-8 rounded-xl shadow-md w-full md:w-1/3">
                <h3 className="text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">1</h3>
                <p className="text-xl font-semibold">Ponto</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Por acertar o resultado (vitória, empate ou derrota), mas não o placar.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} AnalfaBet. Todos os direitos reservados.</p>
          <p className="text-sm mt-2">
            Desenvolvido com ❤️ para os amantes do futebol brasileiro.
          </p>
        </div>
      </footer>
    </div>
  );
};
