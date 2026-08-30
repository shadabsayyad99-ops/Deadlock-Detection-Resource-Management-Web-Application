import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const NotificationToast = () => {
  const { notification } = useAuth();

  if (!notification) return null;

  const { message, type } = notification;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />
  };

  const bgStyles = {
    success: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100 shadow-emerald-900/40',
    error: 'bg-red-950/80 border-red-500/40 text-red-100 shadow-red-900/40',
    warning: 'bg-amber-950/80 border-amber-500/40 text-amber-100 shadow-amber-900/40',
    info: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-100 shadow-cyan-900/40'
  };

  return (
    <div className="fixed top-5 right-5 z-50 animate-bounce-short max-w-md w-full">
      <div className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${bgStyles[type] || bgStyles.info}`}>
        {icons[type] || icons.info}
        <div className="flex-1 text-sm font-medium leading-snug">
          {message}
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
