import QRCode from 'qrcode';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDateIndo = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
};

export interface LeaseStatus {
  daysRemaining: number;
  isExpired: boolean;
  isUrgent: boolean;      // Kurang dari 30 hari
  isUpcoming: boolean;    // Kurang dari 90 hari
  label: string;
  badgeTone: 'rose' | 'amber' | 'blue' | 'emerald';
}

export const getLeaseExpiryStatus = (endDateStr?: string): LeaseStatus => {
  if (!endDateStr) {
    return {
      daysRemaining: 999,
      isExpired: false,
      isUrgent: false,
      isUpcoming: false,
      label: 'Tanpa Batas',
      badgeTone: 'emerald'
    };
  }

  const end = new Date(endDateStr).getTime();
  const now = new Date('2026-10-11T00:00:00').getTime(); // Current system mock/actual date
  const diffTime = end - now;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      daysRemaining: days,
      isExpired: true,
      isUrgent: true,
      isUpcoming: false,
      label: `Lewat ${Math.abs(days)} Hari`,
      badgeTone: 'rose'
    };
  } else if (days <= 30) {
    return {
      daysRemaining: days,
      isExpired: false,
      isUrgent: true,
      isUpcoming: true,
      label: `Segera Berakhir (${days} Hari)`,
      badgeTone: 'rose'
    };
  } else if (days <= 90) {
    return {
      daysRemaining: days,
      isExpired: false,
      isUrgent: false,
      isUpcoming: true,
      label: `Sisa ${days} Hari`,
      badgeTone: 'amber'
    };
  } else {
    const months = Math.floor(days / 30);
    return {
      daysRemaining: days,
      isExpired: false,
      isUrgent: false,
      isUpcoming: false,
      label: `Aktif (${months} Bln)`,
      badgeTone: 'blue'
    };
  }
};

export const generateQRCodeDataUrl = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
};
