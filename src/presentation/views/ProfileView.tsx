import React, { useState, useRef } from 'react';
import { useAuth } from '../state/AuthContext';
import { useFlow } from '../state/FlowContext';
import { BaseCard } from '../components/cards/AppCards';
import { PrimaryButton, SecondaryButton, OutlinedButton, IconButton } from '../components/buttons/AppButtons';
import { CustomTextField, DropdownField } from '../components/inputs/AppInputs';
import { ConfirmationDialog } from '../components/feedback/AppFeedback';
import { formatFullDate, formatReadableDate } from '../../core/utils/date';
import {
  User as UserIcon,
  Camera,
  Trash2,
  Lock,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Settings,
  Mail,
  Key,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    updatePreferences,
    changePassword,
    deleteAccount,
    logout,
  } = useAuth();
  const { stats, tasks, focusSessions } = useFlow();

  // Profile Edit State
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState<string | null>(null);
  const [passErrorMsg, setPassErrorMsg] = useState<string | null>(null);

  // Delete Account Confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File Input Ref for Photo Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileErrorMsg('Ukuran foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        await updateProfile(fullName, dataUrl);
        setProfileSuccessMsg('Foto profil berhasil diperbarui.');
        setTimeout(() => setProfileSuccessMsg(null), 3000);
      } catch (err: any) {
        setProfileErrorMsg('Gagal memperbarui foto profil.');
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = async () => {
    try {
      await updateProfile(fullName, '');
      setProfileSuccessMsg('Foto profil dihapus (menggunakan inisial nama).');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    } catch (err: any) {
      setProfileErrorMsg('Gagal menghapus foto profil.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsUpdatingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    try {
      await updateProfile(fullName.trim());
      setProfileSuccessMsg('Profil berhasil disimpan.');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Gagal menyimpan profil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg(null);
    setPassErrorMsg(null);

    if (newPassword.length < 6) {
      setPassErrorMsg('Kata sandi baru harus minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(newPassword);
      setPassSuccessMsg('Kata sandi berhasil diperbarui.');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPassSuccessMsg(null), 3000);
    } catch (err: any) {
      setPassErrorMsg(err.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus akun. Silakan login ulang terlebih dahulu.');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const currentPrefs = currentUser?.preferences || {
    themeMode: 'system' as const,
    language: 'id' as const,
    startOfWeek: 'monday' as const,
    timeFormat: '24h' as const,
    notificationEnabled: true,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            Akun & Profil Pengguna
          </h2>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
            Kelola identitas akun, foto profil, preferensi planner, dan keamanan data.
          </p>
        </div>

        <SecondaryButton
          icon={LogOut}
          onClick={logout}
          size="md"
          className="self-start sm:self-auto text-[#E07A5F] hover:bg-[#FCF3F0] dark:hover:bg-[#342020]"
        >
          Keluar (Logout)
        </SecondaryButton>
      </div>

      {/* 2. Main Profile Card */}
      <BaseCard>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Upload overlay */}
          <div className="relative group shrink-0">
            {currentUser?.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt={currentUser.fullName}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-[#A995D8]/30 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#A995D8] via-[#F1B8CC] to-[#A9C8E8] flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'F'}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 bg-[#A995D8] hover:bg-[#9680C9] text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-95"
              title="Ganti Foto Profil"
              aria-label="Upload photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Profile Summary & Actions */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {currentUser?.fullName || 'Pengguna FlowDay'}
                </h3>
                <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{currentUser?.email}</span>
                </p>
              </div>

              {currentUser?.photoUrl && (
                <button
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 text-xs text-[#E07A5F] hover:underline self-center sm:self-start"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Foto</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 text-center">
              <div className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                <span className="text-[10px] text-[#898493] block">Tugas Selesai</span>
                <span className="text-sm font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
                  {tasks.filter((t) => t.isCompleted).length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                <span className="text-[10px] text-[#898493] block">Waktu Fokus</span>
                <span className="text-sm font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
                  {Math.round(stats.todayFocusSeconds / 60)}m
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                <span className="text-[10px] text-[#898493] block">Bergabung Sejak</span>
                <span className="text-xs font-mono font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                  {formatReadableDate(currentUser?.createdAt)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                <span className="text-[10px] text-[#898493] block">Status Cloud</span>
                <span className="text-xs font-semibold text-[#B5DCCB]">Firestore Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      {/* 3. Personal Information Form */}
      <BaseCard>
        <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7] mb-1">
          Informasi Pribadi
        </h3>
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
          Perbarui nama tampilan yang akan ditampilkan di FlowDay.
        </p>

        {profileSuccessMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F2F8F5] dark:bg-[#1C3127] border border-[#B5DCCB] text-xs text-[#34313D] dark:text-[#F4F2F7] mb-4">
            <CheckCircle2 className="w-4 h-4 text-[#B5DCCB]" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {profileErrorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F] text-xs text-[#E07A5F] mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{profileErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTextField
              label="Nama Lengkap"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                Alamat Email (Akun)
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#EEEAF2]/40 dark:bg-[#1A1823] text-[#898493] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl cursor-not-allowed min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <PrimaryButton
              type="submit"
              size="md"
              isLoading={isUpdatingProfile}
            >
              Simpan Perubahan Nama
            </PrimaryButton>
          </div>
        </form>
      </BaseCard>

      {/* 4. User Preferences */}
      <BaseCard>
        <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7] mb-1">
          Preferensi Planner & Tampilan
        </h3>
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
          Sesuaikan format waktu, hari awal pekan, dan pengaturan fokus harian Anda.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DropdownField
            label="Tema Tampilan"
            value={currentPrefs.themeMode || 'system'}
            onChange={(e) => updatePreferences({ themeMode: e.target.value as any })}
            options={[
              { value: 'light', label: 'Light Mode (Terang)' },
              { value: 'dark', label: 'Dark Mode (Gelap)' },
              { value: 'system', label: 'System Default' },
            ]}
          />

          <DropdownField
            label="Bahasa Antarmuka"
            value={currentPrefs.language || 'id'}
            onChange={(e) => updatePreferences({ language: e.target.value as any })}
            options={[
              { value: 'id', label: 'Bahasa Indonesia' },
              { value: 'en', label: 'English' },
            ]}
          />

          <DropdownField
            label="Hari Pertama Pekan"
            value={currentPrefs.startOfWeek || 'monday'}
            onChange={(e) => updatePreferences({ startOfWeek: e.target.value as any })}
            options={[
              { value: 'monday', label: 'Senin (Monday)' },
              { value: 'sunday', label: 'Minggu (Sunday)' },
            ]}
          />

          <DropdownField
            label="Format Jam"
            value={currentPrefs.timeFormat || '24h'}
            onChange={(e) => updatePreferences({ timeFormat: e.target.value as any })}
            options={[
              { value: '24h', label: '24 Jam (e.g. 14:30)' },
              { value: '12h', label: '12 Jam AM/PM (e.g. 02:30 PM)' },
            ]}
          />
        </div>
      </BaseCard>

      {/* 5. Security & Password Change */}
      <BaseCard>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-[#A995D8]" />
          <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
            Keamanan & Kata Sandi
          </h3>
        </div>
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
          Ubah kata sandi akun Firebase Authentication Anda secara berkala.
        </p>

        {passSuccessMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F2F8F5] dark:bg-[#1C3127] border border-[#B5DCCB] text-xs text-[#34313D] dark:text-[#F4F2F7] mb-4">
            <CheckCircle2 className="w-4 h-4 text-[#B5DCCB]" />
            <span>{passSuccessMsg}</span>
          </div>
        )}

        {passErrorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F] text-xs text-[#E07A5F] mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{passErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTextField
              label="Kata Sandi Baru"
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <CustomTextField
              label="Ulangi Kata Sandi Baru"
              type="password"
              placeholder="Konfirmasi kata sandi baru"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <PrimaryButton
              type="submit"
              size="md"
              disabled={!newPassword || !confirmNewPassword}
              isLoading={isChangingPass}
            >
              Perbarui Kata Sandi
            </PrimaryButton>
          </div>
        </form>
      </BaseCard>

      {/* 6. Danger Zone: Delete Account */}
      <BaseCard className="border-[#E07A5F]/30 bg-[#FCF3F0]/20 dark:bg-[#342020]/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#E07A5F]">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-bold">Hapus Akun FlowDay</h3>
            </div>
            <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-1 max-w-lg leading-relaxed">
              Tindakan ini permanen. Seluruh dokumen profil dan autentikasi Firebase Anda akan dihapus dan sesi akan diakhiri seketika.
            </p>
          </div>

          <SecondaryButton
            onClick={() => setIsDeleteModalOpen(true)}
            size="md"
            className="text-[#E07A5F] hover:bg-[#FCF3F0] border border-[#E07A5F]/30 shrink-0"
          >
            Hapus Akun
          </SecondaryButton>
        </div>
      </BaseCard>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        title="Konfirmasi Hapus Akun"
        message="Apakah Anda yakin ingin menghapus akun FlowDay Anda secara permanen? Seluruh data akun Anda di Firebase akan dihapus."
        confirmLabel={isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
        isDestructive
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
