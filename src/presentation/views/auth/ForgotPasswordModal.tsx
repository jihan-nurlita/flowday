import React, { useState } from 'react';
import { useAuth } from '../../state/AuthContext';
import { X, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../../components/buttons/AppButtons';
import { CustomTextField } from '../../components/inputs/AppInputs';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Masukkan alamat email terdaftar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EEEAF2] dark:border-[#2D2838]">
          <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
            Reset Password
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2F8F5] dark:bg-[#1C3127] flex items-center justify-center mx-auto text-[#B5DCCB]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
              Tautan Reset Terkirim!
            </h4>
            <p className="text-xs text-[#898493] dark:text-[#9E99A8] max-w-xs mx-auto leading-relaxed">
              Kami telah mengirimkan instruksi pemulihan kata sandi ke <strong>{email}</strong>. Silakan periksa kotak masuk atau spam email Anda.
            </p>
            <div className="pt-3">
              <PrimaryButton onClick={onClose} size="md" fullWidth>
                Selesai
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <p className="text-xs text-[#898493] dark:text-[#9E99A8] leading-relaxed">
              Masukkan alamat email akun FlowDay Anda. Kami akan mengirimkan tautan aman untuk membuat kata sandi baru.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F]/30 text-xs text-[#E07A5F]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <CustomTextField
              label="Alamat Email"
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <SecondaryButton type="button" onClick={onClose} size="md">
                Batal
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                size="md"
                isLoading={isLoading}
              >
                Kirim Tautan Reset
              </PrimaryButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
