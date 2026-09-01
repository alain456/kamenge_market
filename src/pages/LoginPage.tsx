import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsLoading(false);
      const success = login(email);
      if (success) {
        navigate('/dashboard');
      } else {
        setErrorMessage('Identifiants incorrects ou compte inactif');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#d2e8d5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100/80 animate-scale-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-mint-500 text-white rounded-3xl flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-md shadow-mint-500/30">
            MK
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Mall Kamenge
          </h1>
          <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full inline-block mt-2">
            Portail Web d’Administration Back-Office
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
              Adresse Email Professionnelle
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@kamenge-mall.bi"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-mint-500 rounded border-gray-300 focus:ring-mint-500"
              />
              <span>Se souvenir de moi</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Veuillez contacter l’administrateur système pour réinitialiser vos accès.')}
              className="text-xs font-bold text-mint-600 hover:text-mint-700"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-mint-500 hover:bg-mint-600 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Se connecter au Back-Office</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Access disclaimer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed mb-3">
            Accès strictement réservé au personnel administratif et financier du Mall Kamenge.
            Toutes les connexions sont enregistrées et auditées.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-left">
            <p className="text-[10px] font-extrabold text-gray-700 mb-2 uppercase tracking-wide">Comptes de test disponibles :</p>
            <ul className="space-y-1.5">
              <li className="text-[10px] flex items-center justify-between">
                <span className="font-semibold text-gray-600">Admin</span>
                <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 rounded">admin@kamenge-mall.bi</span>
              </li>
              <li className="text-[10px] flex items-center justify-between">
                <span className="font-semibold text-gray-600">Agent</span>
                <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 rounded">agent@kamenge-mall.bi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
