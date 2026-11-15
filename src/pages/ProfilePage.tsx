import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useSettings } from '../hooks/useBusinessData';
import { processAvatarImage } from '../lib/firebase/storage';
import { translateValidationMessage } from '../lib/i18n';
import { changePasswordSchema, userProfileSchema } from '../lib/validators/schemas';
import { DashboardShell } from '../components/layout/DashboardShell';
import { Button, Card, Input } from '../components/ui';

export const ProfilePage: React.FC = () => {
  const {
    user,
    isAdmin,
    profileDisplayName,
    profilePhotoUrl,
    canChangePassword,
    updateMyProfile,
    changeMyPassword,
    sendPasswordReset,
  } = useAuth();
  const { language, t } = useLanguage();
  const { activeBusiness } = useMode();
  const { settings } = useSettings(user, Boolean(user));

  const [displayName, setDisplayName] = useState(profileDisplayName);
  const [nameDirty, setNameDirty] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(profilePhotoUrl);
  const [photoEdited, setPhotoEdited] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingResetLink, setSendingResetLink] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!nameDirty) {
      setDisplayName(profileDisplayName);
    }
  }, [profileDisplayName, nameDirty]);

  useEffect(() => {
    if (!photoEdited) {
      setPhotoPreviewUrl(profilePhotoUrl);
      setAvatarLoadError(false);
    }
  }, [profilePhotoUrl, photoEdited]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.type && !file.type.startsWith('image/')) {
      setProfileMsg({ type: 'err', text: t.profile.invalidImageFile });
      return;
    }

    setProfileMsg(null);
    setProcessingPhoto(true);
    try {
      const processedDataUrl = await processAvatarImage(file);
      setPhotoPreviewUrl(processedDataUrl);
      setPhotoEdited(true);
      setAvatarLoadError(false);
    } catch {
      setProfileMsg({ type: 'err', text: t.profile.invalidImageFile });
    } finally {
      setProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreviewUrl('');
    setPhotoEdited(true);
    setAvatarLoadError(false);
    setProfileMsg(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    const parsed = userProfileSchema.safeParse({
      displayName,
      photoUrl: photoPreviewUrl,
    });

    if (!parsed.success) {
      setProfileMsg({
        type: 'err',
        text: translateValidationMessage(
          parsed.error.issues[0]?.message,
          language,
          'Check your profile details.'
        ),
      });
      return;
    }

    setSavingProfile(true);
    try {
      await updateMyProfile({
        displayName: parsed.data.displayName,
        photoUrl: photoPreviewUrl,
      });
      setNameDirty(false);
      setPhotoEdited(false);
      setProfileMsg({ type: 'ok', text: t.profile.profileSaved });
    } catch (err) {
      setProfileMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      setPasswordMsg({
        type: 'err',
        text: translateValidationMessage(
          parsed.error.issues[0]?.message,
          language,
          'Check your password entries.'
        ),
      });
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword(parsed.data.currentPassword, parsed.data.newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'ok', text: t.profile.passwordUpdated });
    } catch (err) {
      setPasswordMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setPasswordMsg(null);
    setSendingResetLink(true);
    try {
      await sendPasswordReset(user.email);
      setPasswordMsg({ type: 'ok', text: t.login.resetEmailSentNotice });
    } catch (err) {
      setPasswordMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to send password reset email.',
      });
    } finally {
      setSendingResetLink(false);
    }
  };

  const avatarInitial = (displayName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const hasPhoto = Boolean(photoPreviewUrl) && !avatarLoadError;

  return (
    <DashboardShell businessName={activeBusiness?.name || settings?.businessName || 'EkTally'}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Profile Photo & Identity Card */}
        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#27272a] pb-3">
              <UserIcon className="w-4 h-4 text-[#4ade80] shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {t.profile.sectionTitle}
                </h2>
                <p className="text-xs text-zinc-400">{t.profile.sectionDesc}</p>
              </div>
            </div>

            {profileMsg && (
              <div
                role="status"
                className={`text-xs px-3 py-2.5 rounded-lg bg-[#09090b] border flex items-center gap-2 ${
                  profileMsg.type === 'ok'
                    ? 'border-[#22c55e]/30 text-[#4ade80]'
                    : 'border-red-500/30 text-red-400'
                }`}
              >
                {profileMsg.type === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Avatar Preview + Upload Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-[#27272a]/70">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#09090b] border border-[#27272a] shrink-0">
                {hasPhoto ? (
                  <img
                    src={photoPreviewUrl}
                    alt={displayName || 'Profile avatar'}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarLoadError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-[#4ade80] bg-gradient-to-br from-[#18181b] to-[#09090b]">
                    {avatarInitial}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2.5">
                <div>
                  <p className="text-sm font-semibold text-zinc-100 truncate">
                    {displayName.trim() || profileDisplayName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400 mt-0.5">
                    <span className="font-mono truncate max-w-full">{user?.email}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#4ade80]">{t.profile.verifiedBadge}</span>
                    <span aria-hidden="true">·</span>
                    <span>{isAdmin ? t.profile.roleAdmin : t.profile.roleOwner}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    aria-label={t.profile.photoLabel}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={processingPhoto}
                    className="min-h-[42px] sm:min-h-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-3.5 h-3.5 text-[#4ade80]" />
                    {photoPreviewUrl ? t.profile.changePhoto : t.profile.uploadPhoto}
                  </Button>
                  {photoPreviewUrl && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={processingPhoto}
                      className="min-h-[42px] sm:min-h-0"
                      onClick={handleRemovePhoto}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.profile.removePhoto}
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500">{t.profile.photoHint}</p>
              </div>
            </div>

            {/* Name & Read-Only Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t.profile.displayNameLabel}
                required
                maxLength={120}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setNameDirty(true);
                }}
                placeholder={t.profile.displayNamePlaceholder}
              />

              <div className="space-y-1.5">
                <Input
                  label={t.profile.emailLabel}
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  disabled
                  className="font-mono text-zinc-400"
                />
                <p className="text-[11px] text-zinc-500">{t.profile.emailReadOnlyHint}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-[11px] font-mono tabular-nums text-zinc-500 truncate">
                UID: {user?.uid}
              </p>
              <Button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
                disabled={savingProfile || processingPhoto || !displayName.trim()}
              >
                {savingProfile ? t.common.saving : t.profile.saveProfile}
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="p-4 sm:p-6">
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#27272a] pb-3">
              <KeyRound className="w-4 h-4 text-[#4ade80] shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {t.profile.passwordSectionTitle}
                </h2>
                <p className="text-xs text-zinc-400">{t.profile.passwordSectionDesc}</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                role="status"
                className={`text-xs px-3 py-2.5 rounded-lg bg-[#09090b] border flex items-center gap-2 ${
                  passwordMsg.type === 'ok'
                    ? 'border-[#22c55e]/30 text-[#4ade80]'
                    : 'border-red-500/30 text-red-400'
                }`}
              >
                {passwordMsg.type === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            {!canChangePassword ? (
              <div className="p-3.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-zinc-400">
                {t.profile.providerNoPassword}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="profile-current-password"
                        className="block text-xs font-medium text-zinc-300"
                      >
                        {t.profile.currentPasswordLabel}
                      </label>
                      {user?.email && (
                        <button
                          type="button"
                          onClick={handleSendPasswordReset}
                          disabled={sendingResetLink || savingPassword}
                          className="text-[11px] font-medium text-[#4ade80] hover:text-[#86efac] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                          {sendingResetLink ? t.login.sendingResetLink : t.login.forgotPassword}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="profile-current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t.profile.currentPasswordPlaceholder}
                        className="w-full px-3 py-2 pr-11 text-base sm:text-sm min-h-[42px] sm:min-h-0 bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        aria-label={
                          showCurrentPassword ? t.login.hidePassword : t.login.showPassword
                        }
                        className="absolute right-0.5 top-1/2 -translate-y-1/2 min-h-[42px] min-w-[42px] sm:min-h-[34px] sm:min-w-[34px] inline-flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-md cursor-pointer"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-new-password"
                        className="block text-xs font-medium text-zinc-300"
                      >
                        {t.profile.newPasswordLabel}
                      </label>
                      <div className="relative">
                        <input
                          id="profile-new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          maxLength={128}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t.profile.newPasswordPlaceholder}
                          className="w-full px-3 py-2 pr-11 text-base sm:text-sm min-h-[42px] sm:min-h-0 bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          aria-label={
                            showNewPassword ? t.login.hidePassword : t.login.showPassword
                          }
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 min-h-[42px] min-w-[42px] sm:min-h-[34px] sm:min-w-[34px] inline-flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-md cursor-pointer"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-confirm-password"
                        className="block text-xs font-medium text-zinc-300"
                      >
                        {t.profile.confirmPasswordLabel}
                      </label>
                      <div className="relative">
                        <input
                          id="profile-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          maxLength={128}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t.profile.confirmPasswordPlaceholder}
                          className="w-full px-3 py-2 pr-11 text-base sm:text-sm min-h-[42px] sm:min-h-0 bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={
                            showConfirmPassword ? t.login.hidePassword : t.login.showPassword
                          }
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 min-h-[42px] min-w-[42px] sm:min-h-[34px] sm:min-w-[34px] inline-flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-md cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-zinc-500">{t.profile.passwordHint}</p>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
                    disabled={
                      savingPassword || !currentPassword || !newPassword || !confirmPassword
                    }
                  >
                    {savingPassword ? t.profile.updatingPassword : t.profile.updatePassword}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
};
