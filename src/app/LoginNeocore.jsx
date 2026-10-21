import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrb } from './OrbContext';
import { fazerLogin } from '../services/auth';
import '../styles/login.css';

export default function LoginNeocore({ transRef }) {
  const navigate = useNavigate();
  const { setSlotRect, isTransitioning } = useOrb();

  const heroRef = useRef(null);
  const cardRef = useRef(null);
  const orbSlotRef = useRef(null);
  const veilRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [logging, setLogging] = useState(false);
  const [veil, setVeil] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const mfaRefs = useRef([]);

  useEffect(() => {
    document.body.classList.remove('dark-bg');
  }, []);

  /* ---------- Registrar o slot do globo ---------- */
  const updateSlot = useCallback(() => {
    const el = orbSlotRef.current;
    if (el && !isTransitioning) {
      const rect = el.getBoundingClientRect();
      setSlotRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
  }, [setSlotRect, isTransitioning]);

  useEffect(() => {
    updateSlot();
    window.addEventListener('resize', updateSlot);
    /* Atualizar periodicamente durante o primeiro segundo (layout pode flutuar) */
    const intervals = [100, 300, 600, 1000].map(ms => setTimeout(updateSlot, ms));
    return () => {
      window.removeEventListener('resize', updateSlot);
      intervals.forEach(clearTimeout);
    };
  }, [updateSlot]);

  /* ---------- MFA input handlers ---------- */
  const handleMfaInput = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...mfa];
    next[index] = digit;
    setMfa(next);

    if (digit && index < 4) {
      mfaRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !mfa[index] && index > 0) {
      mfaRefs.current[index - 1]?.focus();
    }
  };

  const handleMfaPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (!paste) return;
    const next = [...mfa];
    for (let i = 0; i < paste.length; i++) next[i] = paste[i];
    setMfa(next);
    const focusIdx = Math.min(paste.length, 4);
    mfaRefs.current[focusIdx]?.focus();
  };

  /* ---------- Submit → Transição Cinematográfica ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (logging) return;

    const mfaCode = mfa.join('');
    if (!email.trim() || !password || mfaCode.length < 5) {
      setError('Preencha o e-mail, senha e os 5 dígitos do código MFA.');
      return;
    }

    setLogging(true);
    setError('');

    const result = await fazerLogin(email, password, mfaCode);

    if (!result.success) {
      setError('Credenciais inválidas. Tente novamente.');
      setLogging(false);
      return;
    }

    /* Login bem-sucedido → Disparar a transição cinematográfica */
    if (transRef?.current) {
      transRef.current.start({
        navigate,
        targetPath: '/dashboard',
        heroEl: heroRef.current,
        cardEl: cardRef.current?.closest('.wrap'),
      });
    } else {
      navigate('/dashboard');
    }
  };

  /* ---------- Navegação suave para Cadastro ---------- */
  const handleGoToCadastro = () => {
    if (navigating) return;
    setNavigating(true);

    const cardEl = cardRef.current?.closest('.wrap') || cardRef.current;
    if (cardEl && cardEl.animate) {
      const anim = cardEl.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(24px)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
      );
      anim.onfinish = () => navigate('/cadastro');
    } else {
      navigate('/cadastro');
    }
  };

  return (
    <>
      <div className="page">

        {/* Lado Esquerdo: Hero & Slot do Globo */}
        <section className="hero" ref={heroRef}>
          <h1>O Futuro Do Marketing</h1>
          <p className="hero-desc">
            Criamos experiências digitais na interseção entre design e tecnologia, ajudando nossos clientes a imaginar o futuro.
          </p>

          {/* Slot placeholder — o globo global se posiciona aqui */}
          <div ref={orbSlotRef} className="orb-slot" aria-hidden="true" />
        </section>

        {/* Lado Direito: Card de Login */}
        <section className="wrap">
          <form className="card" ref={cardRef} onSubmit={handleSubmit}>
            {/* Header com Logo */}
            <header className="brand">
              <img src="/logo-n.png" alt="Logo NEOCORE" />
              <span className="name">NEOCORE</span>
              <span className="tag">A EMPRESA MAIS TECH DO MUNDO</span>
            </header>

            <div className="divider" />

            {/* Boas-vindas */}
            <div className="welcome">
              <h2>Bem-vindo de volta</h2>
              <p>Faça login para continuar</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            {/* Campo E-mail */}
            <label className="l" htmlFor="email">
              E-MAIL
            </label>
            <div className="input">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Campo Senha */}
            <label className="l" htmlFor="password">
              SENHA
            </label>
            <div className="input">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <a href="#esqueceu" className="link forgot">
              Esqueceu a senha?
            </a>

            {/* Código MFA */}
            <div className="mfa-wrap">
              <span className="mfa-label">CÓDIGO MFA</span>
              <div className="mfa" onPaste={handleMfaPaste}>
                {mfa.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (mfaRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleMfaInput(idx, e.target.value)}
                    onKeyDown={(e) => handleMfaKeyDown(idx, e)}
                    aria-label={`Dígito MFA ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Botão Submit */}
            <button type="submit" className="submit" disabled={logging}>
              {logging ? 'ENTRANDO...' : 'ENTRAR'}
            </button>

            {/* Divisor "ou" */}
            <div className="or">
              <span>ou</span>
            </div>

            {/* Rodapé Cadastre-se */}
            <p className="signup">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={handleGoToCadastro}
                className="link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                disabled={navigating}
              >
                Cadastre-se
              </button>
            </p>
          </form>
        </section>
      </div>
    </>
  );
}
