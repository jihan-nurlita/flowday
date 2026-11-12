import React, { useState } from 'react';
import { useAuth } from '../../state/AuthContext';
import { Sparkles, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { PrimaryButton, OutlinedButton } from '../../components/buttons/AppButtons';
import { CustomTextField } from '../../components/inputs/AppInputs';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login, loginWithGoogle, errorMessage, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Harap lengkapi email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setLocalError(err.message || 'Gagal masuk akun.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setLocalError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'Login Google dibatalkan.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#FAF9FC] via-[#F4F1FA] to-[#FAF9FC] dark:from-[#17151D] dark:via-[#201D27] dark:to-[#17151D]">
      <div className="w-full max-w-md bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] p-6 sm:p-8 shadow-[0_12px_40px_rgba(52,49,61,0.06)]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#A995D8] to-[#F1B8CC] flex items-center justify-center text-white shadow-xs mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            Welcome Back to FlowDay
          </h2>
          <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-1">
            Masuk untuk mengakses agenda, tugas harian, dan sesi fokus Anda.
          </p>
        </div>

        {/* Error Feedback */}
        {(localError || errorMessage) && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F]/30 text-xs text-[#E07A5F] mb-4 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{localError || errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <CustomTextField
            label="Alamat Email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8]">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-[11px] font-semibold text-[#A995D8] hover:text-[#9680C9] transition-colors cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm bg-[#FAF9FC] dark:bg-[#17151D] text-[#34313D] dark:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <PrimaryButton
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            icon={LogIn}
          >
            Masuk ke FlowDay
          </PrimaryButton>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EEEAF2] dark:border-[#2D2838]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-[#898493]">
            <span className="bg-white dark:bg-[#201D27] px-3 font-semibold">atau lanjutkan dengan</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <OutlinedButton
          type="button"
          onClick={handleGoogleSignIn}
          fullWidth
          size="md"
          isLoading={isGoogleLoading}
        >
          <svg className="w-4 h-4 shrink-0 mr-1.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Google</span>
        </OutlinedButton>

        {/* Footer Navigation Link */}
        <p className="text-center text-xs text-[#898493] dark:text-[#9E99A8] mt-6">
          Belum memiliki akun?{' '}
          <button
            onClick={onNavigateToRegister}
            className="font-bold text-[#A995D8] hover:text-[#9680C9] transition-colors cursor-pointer"
          >
            Daftar Sekarang
          </button>
        </p>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          initialEmail={email}
        />
      </div>
    </div>
  );
};
