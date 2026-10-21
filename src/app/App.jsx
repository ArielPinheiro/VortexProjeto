import React, { useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OrbProvider, useOrb } from './OrbContext';
import OrbScene from './OrbScene';
import TransitionOrchestrator from './TransitionOrchestrator';
import LoginNeocore from './LoginNeocore';
import CadastroNeocore from './CadastroNeocore';
import Dashboard from './Dashboard';
import '../styles/transition.css';

/**
 * GlobalOrb — Renderiza o OrbScene uma única vez, em position:fixed,
 * sincronizando sua posição com o slot informado pela página ativa.
 */
function GlobalOrb() {
  const { orbRef, slotRect, isTransitioning } = useOrb();
  const wrapperRef = useRef(null);

  /* Sincronizar posição com o slot (quando NÃO está em transição) */
  const style = {};
  if (slotRect && !isTransitioning) {
    style.left = `${slotRect.left}px`;
    style.top = `${slotRect.top}px`;
    style.width = `${slotRect.width}px`;
    style.height = `${slotRect.height}px`;
  } else if (!slotRect && !isTransitioning) {
    /* Se nenhuma página registrou um slot, esconder o globo */
    style.opacity = 0;
    style.pointerEvents = 'none';
    style.left = '-9999px';
    style.top = '-9999px';
    style.width = '440px';
    style.height = '440px';
  }

  return (
    <div
      ref={wrapperRef}
      className={`global-orb-wrapper${isTransitioning ? ' transitioning' : ''}`}
      style={style}
    >
      <OrbScene ref={orbRef} />
    </div>
  );
}

function AppInner() {
  const transRef = useRef(null);

  return (
    <>
      {/* Globo global — nunca desmontado */}
      <GlobalOrb />

      {/* Orquestrador de transição */}
      <TransitionOrchestrator ref={transRef} />

      {/* Rotas */}
      <Routes>
        <Route path="/" element={<LoginNeocore transRef={transRef} />} />
        <Route path="/login" element={<LoginNeocore transRef={transRef} />} />
        <Route path="/cadastro" element={<CadastroNeocore />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contatos" element={<Dashboard />} />
        <Route path="*" element={<LoginNeocore transRef={transRef} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <OrbProvider>
        <AppInner />
      </OrbProvider>
    </BrowserRouter>
  );
}
