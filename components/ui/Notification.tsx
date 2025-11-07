import React from 'react';
import { useNotificationState } from '../../context/NotificationContext';

export const Notification: React.FC = () => {
  const notification = useNotificationState();

  if (!notification) {
    return null;
  }

  const baseClasses = 'fixed top-5 right-5 p-4 rounded-md shadow-lg text-white z-50 transition-opacity duration-300 animate-fade-in-down';
  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
      {notification.message}
    </div>
  );
};

// Adicionando uma animação simples no CSS global via tag style (alternativa a modificar o index.html diretamente)
const styles = `
@keyframes fade-in-down {
    0% {
        opacity: 0;
        transform: translateY(-10px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fade-in-down {
    animation: fade-in-down 0.5s ease-out forwards;
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);