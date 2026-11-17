import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileKey2,
  History,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getClients } from '@/lib/clientStore';
import { getPortalUsersByClient, type PortalUser } from '@/lib/portalUserStore';
import {
  decryptFromVault,
  encryptAndStoreInVault,
  generateCryptographicOtp,
  removeVaultEntry,
} from '@/lib/provisioningDelivery/cryptoVault';
import {
  buildSecureDeliveryLink,
  computeExpiryTimestamp,
  createEmptyLicenceRecord,
  formatDateStamp,
  maskRegistrationKey,
} from '@/lib/provisioningDelivery/defaults';
import {
  computeLicenceSummary,
  createActivityEntry,
  loadOtpSecuritySettings,
  loadProvisioningWorkspace,
  saveProvisioningWorkspace,
} from '@/lib/provisioningDelivery/service';
import type {
  ActivationStatus,
  LicenceAssignmentRecord,
  LicenceRecord,
  LinkExpiryOption,
  OtpSecuritySettings,
  ProvisioningWorkspaceState,
} from '@/lib/provisioningDelivery/types';

interface SecureProvisioningModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  subOrderId: string;
  clientName: string;
  productName: string;
  purchasedQuantity: number;
  defaultRecipientEmail?: string;
  defaultRecipientMobile?: string;
}

type SectionTab =
  | 'keys_files'
  | 'encryption_delivery'
  | 'otp_verification'
  | 'assignment'
  | 'activation'
  | 'reassignment'
  | 'history';

type LicenceFilter =
  | 'All'
  | 'Available'
  | 'Assigned'
  | 'Provisioned'
  | 'Activated'
  | 'Pending'
  | 'Expired'
  | 'Deactivated';

const ACTIVATION_STATUSES: ActivationStatus[] = [
  'Not Activated',
  'Activation Pending',
  'Activated',
  'Failed',
  'Suspended',
  'Deactivated',
  'Expired',
];

const ACTIVATION_BADGE: Record<ActivationStatus, string> = {
  'Not Activated': 'bg-slate-100 text-slate-700 border-slate-200',
  'Activation Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  Activated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
  Suspended: 'bg-orange-50 text-orange-700 border-orange-200',
  Deactivated: 'bg-slate-200 text-slate-700 border-slate-300',
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function SecureProvisioningModal({
  open,
  onClose,
  orderId,
  subOrderId,
  clientName,
  productName,
  purchasedQuantity,
  defaultRecipientEmail = '',
  defaultRecipientMobile = '',
}: SecureProvisioningModalProps) {
  const { user, isClientPortalUser } = useAuth();
  const actorName = user?.name || user?.email || (isClientPortalUser ? 'Client Admin' : 'NIDO Admin');
  const actorRoleLabel = user?.role || (isClientPortalUser ? 'Client Admin' : 'NIDO Super Admin');

  const clientPortalUsers = useMemo<PortalUser[]>(() => {
    const matchedClient = getClients().find(
      (c) => c.name.toLowerCase() === clientName.toLowerCase(),
    );
    return matchedClient ? getPortalUsersByClient(matchedClient.id) : [];
  }, [clientName]);

  const effectiveQty = Math.max(1, purchasedQuantity || 1);

  const [workspace, setWorkspace] = useState<ProvisioningWorkspaceState>(() =>
    loadProvisioningWorkspace(
      orderId,
      subOrderId,
      clientName,
      productName,
      effectiveQty,
    ),
  );
  const [otpSettings, setOtpSettings] = useState<OtpSecuritySettings>(() =>
    loadOtpSecuritySettings(),
  );

  const [activeTab, setActiveTab] = useState<SectionTab>('keys_files');
  const [licenceFilter, setLicenceFilter] = useState<LicenceFilter>('All');
  const [selectedLicenceId, setSelectedLicenceId] = useState<string>(
    () => workspace.licences[0]?.id || '',
  );

  // Reload workspace when order changes
  useEffect(() => {
    if (!open) return;
    const loaded = loadProvisioningWorkspace(
      orderId,
      subOrderId,
      clientName,
      productName,
      effectiveQty,
    );
    setWorkspace(loaded);
    setSelectedLicenceId(loaded.licences[0]?.id || '');
    setOtpSettings(loadOtpSecuritySettings());
  }, [open, orderId, subOrderId, clientName, productName, effectiveQty]);

  useEffect(() => {
    const onSettingsUpdated = () => setOtpSettings(loadOtpSecuritySettings());
    window.addEventListener('provisioningSecuritySettingsUpdated', onSettingsUpdated);
    return () =>
      window.removeEventListener('provisioningSecuritySettingsUpdated', onSettingsUpdated);
  }, []);

  const persistWorkspace = (next: ProvisioningWorkspaceState) => {
    setWorkspace(next);
    saveProvisioningWorkspace(next);
  };

  const selectedLicence = useMemo(
    () =>
      workspace.licences.find((l) => l.id === selectedLicenceId) || workspace.licences[0],
    [workspace.licences, selectedLicenceId],
  );

  const summary = useMemo(
    () => computeLicenceSummary(workspace.licences, workspace.purchasedQuantity),
    [workspace.licences, workspace.purchasedQuantity],
  );

  const filteredLicences = useMemo(() => {
    return workspace.licences.filter((l) => {
      if (licenceFilter === 'All') return true;
      if (licenceFilter === 'Available') return l.assignmentStatus === 'Available';
      if (licenceFilter === 'Assigned') return l.assignmentStatus === 'Assigned';
      if (licenceFilter === 'Provisioned') return l.processingStatus === 'Provisioned';
      if (licenceFilter === 'Activated') return l.activationRecord.status === 'Activated';
      if (licenceFilter === 'Pending')
        return (
          l.activationRecord.status === 'Not Activated' ||
          l.activationRecord.status === 'Activation Pending'
        );
      if (licenceFilter === 'Expired') return l.activationRecord.status === 'Expired';
      if (licenceFilter === 'Deactivated') return l.activationRecord.status === 'Deactivated';
      return true;
    });
  }, [workspace.licences, licenceFilter]);

  // ── Tab 1: Registration Key / File Management State ─────────────────────────
  const [manualKeyInput, setManualKeyInput] = useState('');
  const [viewingMetaLicence, setViewingMetaLicence] = useState<LicenceRecord | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const regFileInputRef = useRef<HTMLInputElement>(null);

  const updateLicenceWithHistory = (
    licenceId: string,
    updater: (lic: LicenceRecord) => LicenceRecord,
    activityType: Parameters<typeof createActivityEntry>[1],
    statusLabel: string,
    remarks: string,
  ) => {
    const { date, time } = formatDateStamp();
    let targetRef = 'LIC-001';
    const nextLicences = workspace.licences.map((lic) => {
      if (lic.id !== licenceId) return lic;
      targetRef = lic.licenceRef;
      return { ...updater(lic), lastUpdated: `${date} · ${time}` };
    });
    const entry = createActivityEntry(targetRef, activityType, actorName, statusLabel, remarks);
    persistWorkspace({
      ...workspace,
      licences: nextLicences,
      history: [entry, ...workspace.history],
    });
  };

  const handleSaveManualKey = async () => {
    if (!selectedLicence) return;
    const raw = manualKeyInput.trim();
    if (!raw) {
      toast.error('Enter a registration key before saving.');
      return;
    }
    const masked = maskRegistrationKey(raw);
    try {
      const encoded = new TextEncoder().encode(raw);
      const { sha256Fingerprint } = await encryptAndStoreInVault({
        licenceId: selectedLicence.id,
        kind: 'key',
        data: encoded,
        fileName: `${selectedLicence.licenceRef}-key.txt`,
        mimeType: 'text/plain',
      });
      updateLicenceWithHistory(
        selectedLicence.id,
        (lic) => ({
          ...lic,
          keyMaskedPreview: masked,
          hasKeyInVault: true,
          registrationType: lic.fileMetadata ? 'Key & File' : 'Key',
          processingStatus: 'Provisioned',
          deliveryRecord: {
            ...lic.deliveryRecord,
            encryptionStatus: 'Encrypted',
            encryptionFingerprint: sha256Fingerprint,
          },
        }),
        'Registration key entered',
        'Provisioned',
        `Encrypted registration key (${masked}) via AES-256-GCM (SHA-256: ${sha256Fingerprint}).`,
      );
      setManualKeyInput('');
      toast.success(`Registration key encrypted & saved for ${selectedLicence.licenceRef}.`);
    } catch {
      toast.error('Failed to encrypt registration key in browser vault.');
    }
  };

  const handleUploadRegFile = async (file: File | null, isReplace = false) => {
    if (!selectedLicence || !file) return;
    const { date } = formatDateStamp();
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const { sha256Fingerprint } = await encryptAndStoreInVault({
        licenceId: selectedLicence.id,
        kind: 'file',
        data: buf,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      });
      updateLicenceWithHistory(
        selectedLicence.id,
        (lic) => ({
          ...lic,
          hasFileInVault: true,
          fileMetadata: {
            fileName: file.name,
            fileType: file.type || `.${file.name.split('.').pop() || 'lic'}`,
            fileSizeBytes: file.size,
            uploadDate: date,
          },
          registrationType: lic.keyMaskedPreview ? 'Key & File' : 'File',
          processingStatus: 'Provisioned',
          deliveryRecord: {
            ...lic.deliveryRecord,
            encryptionStatus: 'Encrypted',
            encryptionFingerprint: sha256Fingerprint,
          },
        }),
        isReplace ? 'Registration file replaced' : 'Registration file uploaded',
        'Provisioned',
        `${isReplace ? 'Replaced' : 'Uploaded'} & AES-256-GCM encrypted "${file.name}" (${Math.max(1, Math.round(file.size / 1024))} KB, SHA-256: ${sha256Fingerprint}).`,
      );
      toast.success(`File "${file.name}" encrypted & stored for ${selectedLicence.licenceRef}.`);
    } catch {
      toast.error('Failed to encrypt registration file in browser vault.');
    }
  };

  const handleRemovePendingRecord = async (lic: LicenceRecord) => {
    if (lic.assignmentStatus === 'Assigned') {
      toast.error('Cannot remove an already assigned licence. Reassign or deactivate instead.');
      return;
    }
    try {
      await removeVaultEntry(lic.id);
    } catch {
      // ignore vault cleanup error
    }
    updateLicenceWithHistory(
      lic.id,
      (prev) => ({
        ...prev,
        registrationType: 'Unassigned',
        keyMaskedPreview: undefined,
        hasKeyInVault: false,
        hasFileInVault: false,
        fileMetadata: undefined,
        processingStatus: 'Pending',
        deliveryRecord: {
          ...prev.deliveryRecord,
          encryptionStatus: 'Pending',
          encryptionFingerprint: undefined,
        },
      }),
      'Access revoked',
      'Pending',
      `Cleared pending registration key/file record for ${lic.licenceRef}.`,
    );
    toast.info(`Cleared pending registration record for ${lic.licenceRef}.`);
  };

  const handleBulkProcessSelected = () => {
    if (bulkSelectedIds.length === 0) {
      toast.error('Select one or more licences for bulk update.');
      return;
    }
    const { date, time } = formatDateStamp();
    const nextLicences = workspace.licences.map((lic) =>
      bulkSelectedIds.includes(lic.id)
        ? {
            ...lic,
            processingStatus: 'Provisioned' as const,
            lastUpdated: `${date} · ${time}`,
          }
        : lic,
    );
    const entry = createActivityEntry(
      bulkSelectedIds.map((id) => workspace.licences.find((l) => l.id === id)?.licenceRef || id).join(', '),
      'Encryption status changed',
      actorName,
      'Provisioned',
      `Bulk marked ${bulkSelectedIds.length} licence record(s) as Provisioned.`,
    );
    persistWorkspace({ ...workspace, licences: nextLicences, history: [entry, ...workspace.history] });
    setBulkSelectedIds([]);
    toast.success(`Updated ${bulkSelectedIds.length} licence record(s) to Provisioned.`);
  };

  const handleAddLicenceSlot = () => {
    const nextIdx = workspace.licences.length;
    const newLic = createEmptyLicenceRecord(
      workspace.orderId,
      workspace.subOrderId,
      workspace.productName,
      nextIdx,
    );
    const entry = createActivityEntry(
      newLic.licenceRef,
      'Delivery notification prepared',
      actorName,
      'Available',
      `Added individual unassigned licence record ${newLic.licenceRef}.`,
    );
    persistWorkspace({
      ...workspace,
      purchasedQuantity: Math.max(workspace.purchasedQuantity, nextIdx + 1),
      licences: [...workspace.licences, newLic],
      history: [entry, ...workspace.history],
    });
    setSelectedLicenceId(newLic.id);
    toast.success(`Added ${newLic.licenceRef} as Available (unassigned).`);
  };

  // ── Tab 2: Secure Encryption & Delivery State ──────────────────────────────
  const handleToggleEncryption = () => {
    if (!selectedLicence) return;
    const nextEnc =
      selectedLicence.deliveryRecord.encryptionStatus === 'Encrypted'
        ? 'Pending'
        : 'Encrypted';
    updateLicenceWithHistory(
      selectedLicence.id,
      (lic) => ({
        ...lic,
        deliveryRecord: { ...lic.deliveryRecord, encryptionStatus: nextEnc },
      }),
      'Encryption status changed',
      nextEnc,
      `AES-256-GCM encryption status updated to ${nextEnc}.`,
    );
    toast.success(`Encryption status: ${nextEnc}`);
  };

  const handleUpdateDeliveryConfig = (
    patch: Partial<LicenceRecord['deliveryRecord']>,
    activity: Parameters<typeof createActivityEntry>[1] = 'Delivery notification prepared',
    remarks = 'Updated secure delivery configuration.',
  ) => {
    if (!selectedLicence) return;
    updateLicenceWithHistory(
      selectedLicence.id,
      (lic) => ({
        ...lic,
        deliveryRecord: { ...lic.deliveryRecord, ...patch },
      }),
      activity,
      patch.deliveryStatus || selectedLicence.deliveryRecord.deliveryStatus,
      remarks,
    );
  };

  const handleRegenerateLink = () => {
    if (!selectedLicence) return;
    const { date, time } = formatDateStamp();
    const { token, url } = buildSecureDeliveryLink(workspace.orderId, selectedLicence.licenceRef);
    handleUpdateDeliveryConfig(
      {
        secureLinkPreview: url,
        linkToken: token,
        linkExpiresAt: computeExpiryTimestamp(selectedLicence.deliveryRecord.linkExpiry),
        revoked: false,
        deliveryStatus: 'Ready',
        lastGeneratedAt: `${date} · ${time}`,
      },
      'Secure link generated',
      `Generated secure delivery link (${selectedLicence.deliveryRecord.linkExpiry} expiry).`,
    );
    toast.success('Secure download link regenerated.');
  };

  const handleRevokeLink = () => {
    if (!selectedLicence) return;
    handleUpdateDeliveryConfig(
      { revoked: true, deliveryStatus: 'Revoked' },
      'Access revoked',
      'Revoked secure delivery link.',
    );
    toast.warning('Secure delivery link revoked.');
  };

  const handleDownloadPackage = async () => {
    if (!selectedLicence) return;
    if (selectedLicence.deliveryRecord.revoked) {
      toast.error('This secure link is revoked. Regenerate the link first.');
      return;
    }
    if (
      selectedLicence.deliveryRecord.linkExpiresAt &&
      Date.now() > selectedLicence.deliveryRecord.linkExpiresAt
    ) {
      toast.error('This secure link has expired. Regenerate the link first.');
      return;
    }
    if (
      selectedLicence.deliveryRecord.downloadCount >=
      selectedLicence.deliveryRecord.downloadLimit
    ) {
      toast.error('Download limit reached. Increase limit or regenerate link.');
      return;
    }
    try {
      const decrypted = await decryptFromVault(selectedLicence.id);
      if (decrypted) {
        const blob = new Blob([new Uint8Array(decrypted.bytes)], {
          type: decrypted.mimeType || 'application/octet-stream',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = decrypted.fileName || `${selectedLicence.licenceRef}-licence.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        toast.warning('No encrypted key/file found in browser vault for this licence; recording download event.');
      }
      handleUpdateDeliveryConfig(
        {
          downloadCount: selectedLicence.deliveryRecord.downloadCount + 1,
          deliveryStatus: 'Delivered',
        },
        'File downloaded',
        `Decrypted & downloaded package (#${selectedLicence.deliveryRecord.downloadCount + 1}; activation status remains manual).`,
      );
      toast.success('Licence package decrypted and downloaded. Activation status remains manual.');
    } catch {
      toast.error('Failed to decrypt licence package from vault.');
    }
  };

  const handleSendDelivery = () => {
    if (!selectedLicence) return;
    const email =
      selectedLicence.deliveryRecord.recipientEmail ||
      selectedLicence.assignedEmployee?.email ||
      defaultRecipientEmail;
    if (!email.trim()) {
      toast.error('Enter a recipient email address first.');
      return;
    }
    handleUpdateDeliveryConfig(
      {
        emailNotificationPrepared: true,
        recipientEmail: email,
        deliveryStatus: 'Sent',
      },
      'Delivery notification prepared',
      `Secure delivery notification marked Sent for ${email}.`,
    );
    toast.success(`Delivery notification prepared for ${email}.`);
  };

  // ── Tab 3: OTP Verification (Mobile / Email) State ─────────────────────────
  const [otpChannel, setOtpChannel] = useState<'Mobile' | 'Email'>(
    otpSettings.deliveryMethod === 'Email' ? 'Email' : 'Mobile',
  );
  const [otpMobile, setOtpMobile] = useState(defaultRecipientMobile);
  const [otpEmail, setOtpEmail] = useState(
    selectedLicence?.assignedEmployee?.email || defaultRecipientEmail,
  );
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<
    'idle' | 'sent' | 'verified' | 'invalid' | 'expired' | 'locked'
  >('idle');
  const [attemptsLeft, setAttemptsLeft] = useState(otpSettings.maxAttempts);
  const [validitySecondsLeft, setValiditySecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [showOtpSessionCode, setShowOtpSessionCode] = useState(false);

  useEffect(() => {
    if (validitySecondsLeft <= 0 && resendSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setValiditySecondsLeft((s) => {
        if (s <= 1) {
          if (otpStatus === 'sent' || otpStatus === 'invalid') setOtpStatus('expired');
          return 0;
        }
        return s - 1;
      });
      setResendSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [validitySecondsLeft, resendSecondsLeft, otpStatus]);

  const handleSendOtp = () => {
    const target = otpChannel === 'Mobile' ? otpMobile.trim() : otpEmail.trim();
    if (!target) {
      toast.error(`Enter a recipient ${otpChannel.toLowerCase()} before sending OTP.`);
      return;
    }
    const len = Math.min(8, Math.max(4, otpSettings.otpLength || 6));
    const code = generateCryptographicOtp(len);
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpStatus('sent');
    setAttemptsLeft(otpSettings.maxAttempts);
    setValiditySecondsLeft(otpSettings.otpValidityMinutes * 60);
    setResendSecondsLeft(otpSettings.resendAvailabilitySeconds);
    setShowOtpSessionCode(true);
    if (selectedLicence) {
      const entry = createActivityEntry(
        selectedLicence.licenceRef,
        'OTP verification attempted',
        actorName,
        'OTP Sent',
        `${otpChannel} OTP generated for ${target} (${len} digits, ${otpSettings.otpValidityMinutes}m validity).`,
      );
      persistWorkspace({ ...workspace, history: [entry, ...workspace.history] });
    }
    toast.success(`${otpChannel} OTP generated for ${target}.`);
  };

  const handleVerifyOtp = () => {
    if (!generatedOtp || otpStatus === 'expired' || validitySecondsLeft <= 0) {
      setOtpStatus('expired');
      toast.error('OTP has expired. Click Resend OTP.');
      return;
    }
    if (attemptsLeft <= 0) {
      setOtpStatus('locked');
      toast.error('Maximum OTP attempts exceeded. Resend a new OTP.');
      return;
    }
    if (enteredOtp.trim() === generatedOtp) {
      setOtpStatus('verified');
      if (selectedLicence) {
        const entry = createActivityEntry(
          selectedLicence.licenceRef,
          'OTP verification attempted',
          actorName,
          'Verified',
          `${otpChannel} OTP verified successfully (activation status remains manual).`,
        );
        persistWorkspace({ ...workspace, history: [entry, ...workspace.history] });
      }
      toast.success('OTP verified successfully.');
      return;
    }
    const remaining = attemptsLeft - 1;
    setAttemptsLeft(remaining);
    setOtpStatus(remaining <= 0 ? 'locked' : 'invalid');
    if (selectedLicence) {
      const entry = createActivityEntry(
        selectedLicence.licenceRef,
        'OTP verification attempted',
        actorName,
        remaining <= 0 ? 'Locked' : 'Invalid OTP',
        `Invalid ${otpChannel} OTP entered (${remaining} attempt(s) left).`,
      );
      persistWorkspace({ ...workspace, history: [entry, ...workspace.history] });
    }
    toast.error(
      remaining <= 0
        ? 'Maximum attempts reached. Resend OTP to try again.'
        : `Invalid OTP. ${remaining} attempt(s) remaining.`,
    );
  };

  // ── Tab 4: Licence Assignment State ─────────────────────────────────────────
  const [assignForm, setAssignForm] = useState<LicenceAssignmentRecord>({
    employeeName: '',
    employeeId: '',
    email: '',
    department: '',
    designation: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    assignedBy: actorName,
    remarks: '',
  });

  const handleAssignLicence = () => {
    if (!selectedLicence) return;
    if (selectedLicence.assignmentStatus === 'Assigned') {
      toast.error('This licence is already assigned. Use Licence Reassignment to transfer it.');
      return;
    }
    if (!assignForm.employeeName.trim() || !assignForm.employeeId.trim() || !assignForm.email.trim()) {
      toast.error('Employee Name, Employee ID, and Email Address are required.');
      return;
    }
    const record: LicenceAssignmentRecord = {
      ...assignForm,
      employeeName: assignForm.employeeName.trim(),
      employeeId: assignForm.employeeId.trim(),
      email: assignForm.email.trim(),
      assignedBy: assignForm.assignedBy.trim() || actorName,
    };
    updateLicenceWithHistory(
      selectedLicence.id,
      (lic) => ({
        ...lic,
        assignmentStatus: 'Assigned',
        assignedEmployee: record,
        deliveryRecord: {
          ...lic.deliveryRecord,
          recipientEmail: lic.deliveryRecord.recipientEmail || record.email,
        },
      }),
      'Licence assigned',
      'Assigned',
      `Assigned ${selectedLicence.licenceRef} to ${record.employeeName} (${record.employeeId}, ${record.email}).`,
    );
    setAssignForm((f) => ({
      ...f,
      employeeName: '',
      employeeId: '',
      email: '',
      department: '',
      designation: '',
      remarks: '',
    }));
    toast.success(`${selectedLicence.licenceRef} assigned to ${record.employeeName}.`);
  };

  // ── Tab 5: Manual Activation Management State ───────────────────────────────
  const [actForm, setActForm] = useState({
    status: 'Not Activated' as ActivationStatus,
    activationDate: new Date().toISOString().split('T')[0],
    activationTime: '10:00',
    actualUserName: '',
    employeeId: '',
    email: '',
    deviceName: '',
    updatedBy: actorName,
    remarks: '',
    supportingDocName: '',
  });

  useEffect(() => {
    if (!selectedLicence) return;
    const a = selectedLicence.activationRecord;
    setActForm({
      status: a.status,
      activationDate: a.activationDate || new Date().toISOString().split('T')[0],
      activationTime: a.activationTime || '10:00',
      actualUserName: a.actualUserName || selectedLicence.assignedEmployee?.employeeName || '',
      employeeId: a.employeeId || selectedLicence.assignedEmployee?.employeeId || '',
      email: a.email || selectedLicence.assignedEmployee?.email || '',
      deviceName: a.deviceName || '',
      updatedBy: actorName,
      remarks: a.remarks || '',
      supportingDocName: a.supportingDocName || '',
    });
  }, [selectedLicence?.id, actorName]);

  const handleSaveManualActivation = () => {
    if (!selectedLicence) return;
    const actType =
      actForm.status === 'Deactivated'
        ? 'Licence deactivated'
        : actForm.status === 'Expired'
          ? 'Licence expired'
          : 'Activation details updated';
    updateLicenceWithHistory(
      selectedLicence.id,
      (lic) => ({
        ...lic,
        activationRecord: { ...actForm },
      }),
      actType,
      actForm.status,
      `Manual activation updated to ${actForm.status} by ${actForm.updatedBy || actorName}.${actForm.remarks ? ` Remarks: ${actForm.remarks}` : ''}`,
    );
    toast.success(`Activation status for ${selectedLicence.licenceRef} manually updated to ${actForm.status}.`);
  };

  // ── Tab 6: Licence Reassignment State ───────────────────────────────────────
  const [reassignForm, setReassignForm] = useState({
    employeeName: '',
    employeeId: '',
    email: '',
    department: '',
    designation: '',
    reassignmentDate: new Date().toISOString().split('T')[0],
    reason: '',
    performedBy: actorName,
  });

  const handleReassignLicence = () => {
    if (!selectedLicence) return;
    if (selectedLicence.assignmentStatus !== 'Assigned' || !selectedLicence.assignedEmployee) {
      toast.error('Select an already Assigned licence to reassign.');
      return;
    }
    if (
      !reassignForm.employeeName.trim() ||
      !reassignForm.employeeId.trim() ||
      !reassignForm.email.trim() ||
      !reassignForm.reason.trim()
    ) {
      toast.error('New employee name, ID, email, and reassignment reason are required.');
      return;
    }
    const prevEmp = selectedLicence.assignedEmployee;
    const nextEmp: LicenceAssignmentRecord = {
      employeeName: reassignForm.employeeName.trim(),
      employeeId: reassignForm.employeeId.trim(),
      email: reassignForm.email.trim(),
      department: reassignForm.department.trim(),
      designation: reassignForm.designation.trim(),
      assignmentDate: reassignForm.reassignmentDate,
      assignedBy: reassignForm.performedBy.trim() || actorName,
      remarks: `Reassigned from ${prevEmp.employeeName}: ${reassignForm.reason.trim()}`,
    };
    updateLicenceWithHistory(
      selectedLicence.id,
      (lic) => ({
        ...lic,
        assignmentStatus: 'Assigned',
        assignedEmployee: nextEmp,
        previousAssignments: [...(lic.previousAssignments || []), prevEmp],
      }),
      'Licence reassigned',
      'Assigned',
      `Reassigned ${selectedLicence.licenceRef} from ${prevEmp.employeeName} (${prevEmp.employeeId}) to ${nextEmp.employeeName} (${nextEmp.employeeId}). Reason: ${reassignForm.reason.trim()}`,
    );
    setReassignForm((f) => ({
      ...f,
      employeeName: '',
      employeeId: '',
      email: '',
      department: '',
      designation: '',
      reason: '',
    }));
    toast.success(
      `${selectedLicence.licenceRef} reassigned to ${nextEmp.employeeName}. Previous employee record preserved.`,
    );
  };

  // ── Tab 7: History Filter State ─────────────────────────────────────────────
  const [historySearch, setHistorySearch] = useState('');
  const [historyLicenceFilter, setHistoryLicenceFilter] = useState('All');
  const [historySortOrder, setHistorySortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const list = workspace.history.filter((h) => {
      const matchLic = historyLicenceFilter === 'All' || h.licenceRef === historyLicenceFilter;
      const matchQ =
        !q ||
        h.licenceRef.toLowerCase().includes(q) ||
        h.activity.toLowerCase().includes(q) ||
        h.userResponsible.toLowerCase().includes(q) ||
        h.remarks.toLowerCase().includes(q);
      return matchLic && matchQ;
    });
    return [...list].sort((a, b) =>
      historySortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp,
    );
  }, [workspace.history, historyLicenceFilter, historySearch, historySortOrder]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[650] bg-slate-900/55 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  NIDO Secure Provisioning &amp; Licence Delivery System
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live · AES-256-GCM Vault
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Role: {actorRoleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Order: <strong className="text-slate-700">{workspace.orderId}</strong> · Client:{' '}
                <strong className="text-slate-700">{workspace.clientName}</strong> · Product:{' '}
                <strong className="text-slate-700">{workspace.productName}</strong> (Qty:{' '}
                {workspace.purchasedQuantity})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/40">
          {/* Security Notice */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 flex items-center gap-2.5 text-xs text-blue-900">
            <ShieldCheck size={15} className="text-blue-600 shrink-0" />
            <span>
              <strong>Web Crypto AES-256-GCM Active:</strong> Keys and registration files are encrypted in-browser and stored in the IndexedDB vault; only masked previews and audit metadata are persisted in <code className="px-1 bg-blue-100 rounded">localStorage</code>.
            </span>
          </div>

          {/* 9. Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Purchased Licences', value: summary.totalPurchased, color: 'text-slate-900 bg-white border-slate-200' },
              { label: 'Available Licences', value: summary.available, color: 'text-blue-700 bg-blue-50/50 border-blue-200' },
              { label: 'Assigned Licences', value: summary.assigned, color: 'text-indigo-700 bg-indigo-50/50 border-indigo-200' },
              { label: 'Activated Licences', value: summary.activated, color: 'text-emerald-700 bg-emerald-50/50 border-emerald-200' },
              { label: 'Pending Activations', value: summary.pendingActivations, color: 'text-amber-700 bg-amber-50/50 border-amber-200' },
              { label: 'Expired Licences', value: summary.expired, color: 'text-rose-700 bg-rose-50/50 border-rose-200' },
            ].map((card) => (
              <div key={card.label} className={`rounded-xl border p-3 ${card.color}`}>
                <p className="text-[11px] font-medium opacity-80 leading-snug">{card.label}</p>
                <p className="text-xl font-bold mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Individual Licence Table + Filters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    'All',
                    'Available',
                    'Assigned',
                    'Provisioned',
                    'Activated',
                    'Pending',
                    'Expired',
                    'Deactivated',
                  ] as LicenceFilter[]
                ).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setLicenceFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      licenceFilter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddLicenceSlot}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                + Add Licence Slot
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left">Licence Ref</th>
                    <th className="px-3 py-2 text-left">Product Name</th>
                    <th className="px-3 py-2 text-left">Reg. Type</th>
                    <th className="px-3 py-2 text-left">Assigned Employee</th>
                    <th className="px-3 py-2 text-left">Assignment Date</th>
                    <th className="px-3 py-2 text-left">Delivery Status</th>
                    <th className="px-3 py-2 text-left">Activation Status</th>
                    <th className="px-3 py-2 text-left">Last Updated</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLicences.map((lic) => {
                    const isSel = selectedLicence?.id === lic.id;
                    return (
                      <tr
                        key={lic.id}
                        onClick={() => setSelectedLicenceId(lic.id)}
                        className={`cursor-pointer transition-colors ${
                          isSel ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                          {lic.licenceRef}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{lic.productName}</td>
                        <td className="px-3 py-2.5 text-slate-600">{lic.registrationType}</td>
                        <td className="px-3 py-2.5">
                          {lic.assignedEmployee ? (
                            <div>
                              <p className="font-semibold text-slate-900">
                                {lic.assignedEmployee.employeeName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {lic.assignedEmployee.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {lic.assignedEmployee?.assignmentDate || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {lic.deliveryRecord.deliveryStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              ACTIVATION_BADGE[lic.activationRecord.status]
                            }`}
                          >
                            {lic.activationRecord.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{lic.lastUpdated}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLicenceId(lic.id);
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              isSel
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSel ? 'Selected' : 'Manage'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLicences.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                        No licences match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6+ Interconnected Workflow Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-wrap gap-1 px-3 pt-2.5 border-b border-slate-200 bg-slate-50">
              {(
                [
                  { id: 'keys_files', label: '1. Keys & Files', icon: KeyRound },
                  { id: 'encryption_delivery', label: '2. Encryption & Delivery', icon: Lock },
                  { id: 'otp_verification', label: '3. OTP Verification', icon: Smartphone },
                  { id: 'assignment', label: '4. Licence Assignment', icon: UserPlus },
                  { id: 'activation', label: '5. Manual Activation', icon: UserCheck },
                  { id: 'reassignment', label: '6. Reassignment', icon: ArrowRightLeft },
                  { id: 'history', label: '7. Activity History', icon: History },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                      active
                        ? 'border-blue-600 text-blue-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-5">
              {selectedLicence && (
                <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">
                    Active Licence:{' '}
                    <strong className="font-mono text-slate-900">{selectedLicence.licenceRef}</strong>{' '}
                    ({selectedLicence.assignmentStatus} · {selectedLicence.activationRecord.status})
                  </span>
                  {selectedLicence.keyMaskedPreview && (
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Key Preview: {selectedLicence.keyMaskedPreview}
                    </span>
                  )}
                </div>
              )}

              {/* ── 1. REGISTRATION KEY / FILE MANAGEMENT ── */}
              {activeTab === 'keys_files' && selectedLicence && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Manual Key Entry */}
                    <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                        <KeyRound size={14} className="text-blue-600" /> Manual Registration Key Entry
                      </h4>
                      <input
                        type="text"
                        value={manualKeyInput}
                        onChange={(e) => setManualKeyInput(e.target.value)}
                        placeholder="Enter registration / serial key (kept in memory only)..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          Only masked preview is stored in <code className="px-1 bg-slate-100 rounded">localStorage</code>; full key is AES-256-GCM encrypted in IndexedDB.
                        </span>
                        <button
                          type="button"
                          data-confirmation-skip
                          onClick={handleSaveManualKey}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Save Key
                        </button>
                      </div>
                    </div>

                    {/* Registration File Upload */}
                    <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                        <Upload size={14} className="text-blue-600" /> Registration File Upload
                      </h4>
                      <input
                        ref={regFileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          if (f) handleUploadRegFile(f, Boolean(selectedLicence.fileMetadata));
                          e.target.value = '';
                        }}
                      />
                      {selectedLicence.fileMetadata ? (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <p className="font-semibold text-slate-800">
                            {selectedLicence.fileMetadata.fileName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Type: {selectedLicence.fileMetadata.fileType} · Uploaded:{' '}
                            {selectedLicence.fileMetadata.uploadDate}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No registration file uploaded yet.</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => regFileInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          {selectedLicence.fileMetadata ? 'Replace File' : 'Upload File'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingMetaLicence(selectedLicence)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={12} /> View Metadata
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePendingRecord(selectedLicence)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={12} /> Remove Pending
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Licence Management */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700">Bulk Selection:</span>
                      {workspace.licences.map((lic) => {
                        const checked = bulkSelectedIds.includes(lic.id);
                        return (
                          <label
                            key={lic.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setBulkSelectedIds((prev) =>
                                  e.target.checked
                                    ? [...prev, lic.id]
                                    : prev.filter((x) => x !== lic.id),
                                )
                              }
                            />
                            <span className="font-mono font-semibold">{lic.licenceRef}</span>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={handleBulkProcessSelected}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Mark Selected Provisioned
                    </button>
                  </div>
                </div>
              )}

              {/* ── 2. SECURE ENCRYPTION & DELIVERY ── */}
              {activeTab === 'encryption_delivery' && selectedLicence && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                        <Lock size={14} className="text-blue-600" /> Encryption &amp; Link Controls
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {selectedLicence.deliveryRecord.encryptionMethod}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span>
                        Encryption Status:{' '}
                        <strong>{selectedLicence.deliveryRecord.encryptionStatus}</strong>
                        {selectedLicence.deliveryRecord.encryptionFingerprint && (
                          <span className="block text-[10px] font-mono text-slate-500">
                            SHA-256: {selectedLicence.deliveryRecord.encryptionFingerprint}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleEncryption}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Toggle Encryption Status
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Link Expiry</label>
                        <select
                          value={selectedLicence.deliveryRecord.linkExpiry}
                          onChange={(e) =>
                            handleUpdateDeliveryConfig(
                              { linkExpiry: e.target.value as LinkExpiryOption },
                              'Delivery notification prepared',
                              `Link expiry set to ${e.target.value}.`,
                            )
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="24 hours">24 hours</option>
                          <option value="48 hours">48 hours</option>
                          <option value="7 days">7 days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Download Limit ({selectedLicence.deliveryRecord.downloadCount} used)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={selectedLicence.deliveryRecord.downloadLimit}
                          onChange={(e) =>
                            handleUpdateDeliveryConfig({
                              downloadLimit: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <p className="font-semibold text-slate-600">Secure Download Link Preview</p>
                      <p className="font-mono text-[11px] text-blue-700 break-all">
                        {selectedLicence.deliveryRecord.revoked
                          ? '[REVOKED] ' + selectedLicence.deliveryRecord.secureLinkPreview
                          : selectedLicence.deliveryRecord.secureLinkPreview}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleRegenerateLink}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <RefreshCw size={12} /> Regenerate Link
                      </button>
                      <button
                        type="button"
                        onClick={handleRevokeLink}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <ShieldAlert size={12} /> Revoke Link
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPackage}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <Download size={12} /> Decrypt &amp; Download
                      </button>
                    </div>
                  </div>

                  {/* Email Notification Preview */}
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                      <Mail size={14} className="text-blue-600" /> Email Notification Preview
                    </h4>
                    <input
                      type="email"
                      value={
                        selectedLicence.deliveryRecord.recipientEmail ||
                        selectedLicence.assignedEmployee?.email ||
                        defaultRecipientEmail
                      }
                      onChange={(e) =>
                        handleUpdateDeliveryConfig({ recipientEmail: e.target.value })
                      }
                      placeholder="Recipient email..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <p className="font-semibold text-slate-800">
                        Subject: Secure Licence Delivery — {workspace.productName} ({selectedLicence.licenceRef})
                      </p>
                      <p className="text-slate-600">
                        Dear {selectedLicence.assignedEmployee?.employeeName || 'Authorized Recipient'},
                      </p>
                      <p className="text-slate-600">
                        Your encrypted ({selectedLicence.deliveryRecord.encryptionMethod}) licence package for{' '}
                        <strong>{workspace.productName}</strong> is ready. Link expires in{' '}
                        <strong>{selectedLicence.deliveryRecord.linkExpiry}</strong> (max{' '}
                        {selectedLicence.deliveryRecord.downloadLimit} downloads). OTP verification is required before access.
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">
                        Status: <strong>{selectedLicence.deliveryRecord.deliveryStatus}</strong>
                      </span>
                      <button
                        type="button"
                        data-confirmation-skip
                        onClick={handleSendDelivery}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Prepare / Mark Delivery Sent
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 3. OTP VERIFICATION (MOBILE / EMAIL) ── */}
              {activeTab === 'otp_verification' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-900">
                    <strong>Provisioning OTP Security Policy:</strong> Using live settings from{' '}
                    <em>Configuration Hub → Security Settings → Provisioning Security</em> (Length:{' '}
                    {otpSettings.otpLength} digits · Validity: {otpSettings.otpValidityMinutes}m · Max
                    Attempts: {otpSettings.maxAttempts} · Resend: {otpSettings.resendAvailabilitySeconds}s).
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        Select OTP Delivery Channel
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={otpSettings.deliveryMethod === 'Email'}
                          onClick={() => setOtpChannel('Mobile')}
                          className={`p-3 rounded-xl border text-left text-xs ${
                            otpChannel === 'Mobile'
                              ? 'border-blue-600 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-white text-slate-700'
                          } disabled:opacity-40`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <Smartphone size={14} /> Option A: Mobile OTP
                          </div>
                          <p className="text-[11px] mt-1 font-mono">{otpMobile}</p>
                        </button>
                        <button
                          type="button"
                          disabled={otpSettings.deliveryMethod === 'Mobile'}
                          onClick={() => setOtpChannel('Email')}
                          className={`p-3 rounded-xl border text-left text-xs ${
                            otpChannel === 'Email'
                              ? 'border-blue-600 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-white text-slate-700'
                          } disabled:opacity-40`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <Mail size={14} /> Option B: Email OTP
                          </div>
                          <p className="text-[11px] mt-1 font-mono truncate">{otpEmail}</p>
                        </button>
                      </div>

                      {otpChannel === 'Mobile' ? (
                        <input
                          type="text"
                          value={otpMobile}
                          onChange={(e) => setOtpMobile(e.target.value)}
                          placeholder="Registered mobile number"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                        />
                      ) : (
                        <input
                          type="email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          placeholder="Registered email address"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={resendSecondsLeft > 0 && otpStatus === 'sent'}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {generatedOtp ? 'Resend OTP' : 'Send OTP'}
                        </button>
                        {resendSecondsLeft > 0 && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} /> Resend in {resendSecondsLeft}s
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        Enter {otpSettings.otpLength}-Digit OTP
                      </h4>
                      <input
                        type="text"
                        maxLength={otpSettings.otpLength}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder={`Enter ${otpSettings.otpLength}-digit OTP`}
                        className="w-full px-3 py-2.5 text-center tracking-[0.4em] text-base font-mono font-bold border border-slate-300 rounded-lg"
                      />
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Expires in:{' '}
                          <strong>
                            {Math.floor(validitySecondsLeft / 60)}:
                            {String(validitySecondsLeft % 60).padStart(2, '0')}
                          </strong>
                        </span>
                        <span>Attempts left: {attemptsLeft}</span>
                      </div>
                      {showOtpSessionCode && generatedOtp && (
                        <div className="p-2 rounded-lg bg-slate-100 text-xs font-mono text-slate-700">
                          Session OTP (local gateway fallback): <strong>{generatedOtp}</strong>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Verify OTP
                      </button>

                      {otpStatus === 'verified' && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> OTP Verified. Activation status remains manual.
                        </div>
                      )}
                      {otpStatus === 'invalid' && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                          Invalid OTP. {attemptsLeft} attempt(s) remaining.
                        </div>
                      )}
                      {(otpStatus === 'expired' || otpStatus === 'locked') && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                          {otpStatus === 'expired'
                            ? 'OTP Expired. Click Resend OTP.'
                            : 'Maximum attempts exceeded. Resend OTP.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4. LICENCE ASSIGNMENT MANAGEMENT ── */}
              {activeTab === 'assignment' && selectedLicence && (
                <div className="space-y-4">
                  {selectedLicence.assignedEmployee ? (
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs space-y-1">
                      <p className="font-bold text-indigo-900">
                        {selectedLicence.licenceRef} is currently Assigned to{' '}
                        {selectedLicence.assignedEmployee.employeeName}
                      </p>
                      <p className="text-indigo-800">
                        ID: {selectedLicence.assignedEmployee.employeeId} · Email:{' '}
                        {selectedLicence.assignedEmployee.email} · Dept:{' '}
                        {selectedLicence.assignedEmployee.department || '—'} · Date:{' '}
                        {selectedLicence.assignedEmployee.assignmentDate}
                      </p>
                      <p className="text-indigo-700">
                        Use the <strong>Reassignment</strong> tab to transfer this licence to a new employee while preserving history.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientPortalUsers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-600">Quick-fill from Client Portal Users:</span>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const picked = clientPortalUsers.find((u) => u.id === e.target.value);
                              if (!picked) return;
                              setAssignForm((f) => ({
                                ...f,
                                employeeName: picked.name || f.employeeName,
                                employeeId: picked.id || f.employeeId,
                                email: picked.email || f.email,
                                department: picked.department || f.department,
                                designation: picked.designation || picked.role || f.designation,
                              }));
                            }}
                            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
                          >
                            <option value="">Select a client user...</option>
                            {clientPortalUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <input
                        placeholder="Employee Name *"
                        value={assignForm.employeeName}
                        onChange={(e) => setAssignForm((f) => ({ ...f, employeeName: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Employee ID *"
                        value={assignForm.employeeId}
                        onChange={(e) => setAssignForm((f) => ({ ...f, employeeId: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <input
                        type="email"
                        placeholder="Email Address *"
                        value={assignForm.email}
                        onChange={(e) => setAssignForm((f) => ({ ...f, email: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Department"
                        value={assignForm.department}
                        onChange={(e) => setAssignForm((f) => ({ ...f, department: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Designation"
                        value={assignForm.designation}
                        onChange={(e) => setAssignForm((f) => ({ ...f, designation: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <input
                        type="date"
                        value={assignForm.assignmentDate}
                        onChange={(e) => setAssignForm((f) => ({ ...f, assignmentDate: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Assigned By"
                        value={assignForm.assignedBy}
                        onChange={(e) => setAssignForm((f) => ({ ...f, assignedBy: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Assignment Remarks"
                        value={assignForm.remarks}
                        onChange={(e) => setAssignForm((f) => ({ ...f, remarks: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                        <button
                          type="button"
                          data-confirmation-skip
                          onClick={handleAssignLicence}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Assign {selectedLicence.licenceRef} to Employee
                        </button>
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 5. MANUAL ACTIVATION MANAGEMENT ── */}
              {activeTab === 'activation' && selectedLicence && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    All activation updates are strictly manual in this phase. File downloads and OTP verification never auto-change activation status.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Activation Status</label>
                      <select
                        value={actForm.status}
                        onChange={(e) =>
                          setActForm((f) => ({ ...f, status: e.target.value as ActivationStatus }))
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                      >
                        {ACTIVATION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Activation Date</label>
                      <input
                        type="date"
                        value={actForm.activationDate}
                        onChange={(e) => setActForm((f) => ({ ...f, activationDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Activation Time</label>
                      <input
                        type="time"
                        value={actForm.activationTime}
                        onChange={(e) => setActForm((f) => ({ ...f, activationTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Actual User Name</label>
                      <input
                        value={actForm.actualUserName}
                        onChange={(e) => setActForm((f) => ({ ...f, actualUserName: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Employee ID</label>
                      <input
                        value={actForm.employeeId}
                        onChange={(e) => setActForm((f) => ({ ...f, employeeId: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={actForm.email}
                        onChange={(e) => setActForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Device Name (Optional)</label>
                      <input
                        value={actForm.deviceName}
                        onChange={(e) => setActForm((f) => ({ ...f, deviceName: e.target.value }))}
                        placeholder="e.g. ABC-FIN-LT04"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Updated By</label>
                      <input
                        value={actForm.updatedBy}
                        onChange={(e) => setActForm((f) => ({ ...f, updatedBy: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-600 mb-1">Activation Remarks</label>
                      <input
                        value={actForm.remarks}
                        onChange={(e) => setActForm((f) => ({ ...f, remarks: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-600 mb-1">
                        Supporting Document (Optional)
                      </label>
                      <input
                        type="file"
                        onChange={(e) =>
                          setActForm((f) => ({
                            ...f,
                            supportingDocName: e.target.files?.[0]?.name || f.supportingDocName,
                          }))
                        }
                        className="w-full text-xs text-slate-600"
                      />
                      {actForm.supportingDocName && (
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Attached: {actForm.supportingDocName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      data-confirmation-skip
                      onClick={handleSaveManualActivation}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Save Manual Activation Record
                    </button>
                  </div>
                </div>
              )}

              {/* ── 6. LICENCE REASSIGNMENT ── */}
              {activeTab === 'reassignment' && selectedLicence && (
                <div className="space-y-4">
                  {selectedLicence.assignmentStatus !== 'Assigned' || !selectedLicence.assignedEmployee ? (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
                      Select an <strong>Assigned</strong> licence from the table above to reassign it to a new employee.
                    </div>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <p className="font-bold text-slate-800">Previous / Current Employee (Preserved)</p>
                        <p className="text-slate-600">
                          {selectedLicence.assignedEmployee.employeeName} (
                          {selectedLicence.assignedEmployee.employeeId}) ·{' '}
                          {selectedLicence.assignedEmployee.email} ·{' '}
                          {selectedLicence.assignedEmployee.department || '—'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <input
                          placeholder="New Employee Name *"
                          value={reassignForm.employeeName}
                          onChange={(e) =>
                            setReassignForm((f) => ({ ...f, employeeName: e.target.value }))
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                        <input
                          placeholder="New Employee ID *"
                          value={reassignForm.employeeId}
                          onChange={(e) =>
                            setReassignForm((f) => ({ ...f, employeeId: e.target.value }))
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                        <input
                          type="email"
                          placeholder="New Email Address *"
                          value={reassignForm.email}
                          onChange={(e) => setReassignForm((f) => ({ ...f, email: e.target.value }))}
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                        <input
                          placeholder="Department"
                          value={reassignForm.department}
                          onChange={(e) =>
                            setReassignForm((f) => ({ ...f, department: e.target.value }))
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                        <input
                          placeholder="Designation"
                          value={reassignForm.designation}
                          onChange={(e) =>
                            setReassignForm((f) => ({ ...f, designation: e.target.value }))
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                        <input
                          type="date"
                          value={reassignForm.reassignmentDate}
                          onChange={(e) =>
                            setReassignForm((f) => ({ ...f, reassignmentDate: e.target.value }))
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                        <input
                          placeholder="Performed By"
                          value={reassignForm.performedBy}
                          onChange={(e) =>
                            setReassignForm((f) => ({ ...f, performedBy: e.target.value }))
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                        <input
                          placeholder="Reassignment Reason *"
                          value={reassignForm.reason}
                          onChange={(e) => setReassignForm((f) => ({ ...f, reason: e.target.value }))}
                          className="px-3 py-2 border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          data-confirmation-skip
                          onClick={handleReassignLicence}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Save Reassignment
                        </button>
                      </div>

                      {(selectedLicence.previousAssignments || []).length > 0 && (
                        <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                          <p className="font-bold text-slate-700">Preserved Previous Assignments</p>
                          {selectedLicence.previousAssignments.map((prev, idx) => (
                            <p key={idx} className="text-slate-500">
                              {prev.employeeName} ({prev.employeeId}) · {prev.email} · Assigned on{' '}
                              {prev.assignmentDate}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── 7. PROVISIONING & ACTIVATION HISTORY ── */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Search activity, user, licence ref, or remarks..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <select
                      value={historyLicenceFilter}
                      onChange={(e) => setHistoryLicenceFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="All">All Licences</option>
                      {workspace.licences.map((l) => (
                        <option key={l.id} value={l.licenceRef}>
                          {l.licenceRef}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setHistorySortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50"
                    >
                      Sort: {historySortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left">Date &amp; Time</th>
                          <th className="px-3 py-2 text-left">Licence</th>
                          <th className="px-3 py-2 text-left">Activity</th>
                          <th className="px-3 py-2 text-left">User Responsible</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map((h) => (
                          <tr key={h.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                              {h.date} · {h.time}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                              {h.licenceRef}
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-900">{h.activity}</td>
                            <td className="px-3 py-2 text-slate-700">{h.userResponsible}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {h.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600">{h.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Metadata Sub-modal */}
        {viewingMetaLicence && (
          <div
            className="fixed inset-0 z-[700] bg-slate-900/50 flex items-center justify-center p-4"
            onClick={() => setViewingMetaLicence(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileKey2 size={15} className="text-blue-600" /> Registration Metadata —{' '}
                  {viewingMetaLicence.licenceRef}
                </h4>
                <button
                  type="button"
                  onClick={() => setViewingMetaLicence(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-1.5 text-slate-700">
                <p>
                  <strong>Registration Type:</strong> {viewingMetaLicence.registrationType}
                </p>
                <p>
                  <strong>Masked Key Preview:</strong>{' '}
                  {viewingMetaLicence.keyMaskedPreview || 'Not entered'}
                </p>
                <p>
                  <strong>File Name:</strong>{' '}
                  {viewingMetaLicence.fileMetadata?.fileName || 'No file uploaded'}
                </p>
                <p>
                  <strong>File Type:</strong>{' '}
                  {viewingMetaLicence.fileMetadata?.fileType || '—'}
                </p>
                <p>
                  <strong>Upload Date:</strong>{' '}
                  {viewingMetaLicence.fileMetadata?.uploadDate || '—'}
                </p>
                <p>
                  <strong>Processing Status:</strong> {viewingMetaLicence.processingStatus}
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingMetaLicence(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

