export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return formatter.format(amount);
};
export const formatNumber = (value: number): string => new Intl.NumberFormat('es-ES').format(value);
export const formatPercentage = (value: number): string => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(dateObj);
};
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date(); const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  if (diffInSeconds < 60) return 'hace un momento';
  if (diffInSeconds < 3600) { const m = Math.floor(diffInSeconds / 60); return `hace ${m} ${m === 1 ? 'minuto' : 'minutos'}`; }
  if (diffInSeconds < 86400) { const h = Math.floor(diffInSeconds / 3600); return `hace ${h} ${h === 1 ? 'hora' : 'horas'}`; }
  const d = Math.floor(diffInSeconds / 86400);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
};
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
export const formatAccountNumber = (accountNumber: string): string => accountNumber.length <= 4 ? accountNumber : '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
export const formatTransactionId = (id: string): string => `${id.slice(0, 8)}...${id.slice(-8)}`;
export const getStatusColor = (status: string): string => {
  switch ((status || '').toLowerCase()) {
    case 'completed': case 'active': case 'success': return 'text-green-600 dark:text-green-400';
    case 'pending': case 'processing': return 'text-yellow-600 dark:text-yellow-400';
    case 'failed': case 'error': case 'inactive': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
};
export const getStatusBgColor = (status: string): string => {
  switch ((status || '').toLowerCase()) {
    case 'completed': case 'active': case 'success': return 'bg-green-100 dark:bg-green-900/20';
    case 'pending': case 'processing': return 'bg-yellow-100 dark:bg-yellow-900/20';
    case 'failed': case 'error': case 'inactive': return 'bg-red-100 dark:bg-red-900/20';
    default: return 'bg-gray-100 dark:bg-gray-900/20';
  }
};
