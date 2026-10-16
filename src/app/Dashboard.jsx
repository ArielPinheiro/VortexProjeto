import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h2>Login realizado</h2>
      <p>Aqui entra a próxima página do seu sistema.</p>
      <button type="button" onClick={() => navigate('/')}>
        Voltar ao login
      </button>
    </div>
  );
}
