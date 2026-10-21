import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('dark-bg');
    return () => {
      document.body.classList.remove('dark-bg');
    };
  }, []);

  const handleBackToLogin = () => {
    document.body.classList.remove('dark-bg');
    navigate('/');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-badge">
          <span className="badge-dot" />
          <span>SESSÃO AUTENTICADA</span>
        </div>
        <h2>Login realizado</h2>
        <p>Aqui entra a próxima página do seu sistema.</p>
        <button type="button" onClick={handleBackToLogin}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
