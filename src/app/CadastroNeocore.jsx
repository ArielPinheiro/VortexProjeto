import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrb } from './OrbContext';
import { cadastrarUsuario } from '../services/auth';
import '../styles/cadastro.css';

/* ---------- Helpers ---------- */
const maskCpf = (value) => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const isValidCpf = (cpf) => {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };

  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function CadastroNeocore() {
  const navigate = useNavigate();
  const { setSlotRect, isTransitioning } = useOrb();
  const orbSlotRef = useRef(null);
  const cardRef = useRef(null);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    cpf: '',
    mfa: '',
  });
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceiteNovidades, setAceiteNovidades] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [veil, setVeil] = useState(false);
  const [navigating, setNavigating] = useState(false);

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
    const intervals = [100, 300, 600, 1000].map(ms => setTimeout(updateSlot, ms));
    return () => {
      window.removeEventListener('resize', updateSlot);
      intervals.forEach(clearTimeout);
    };
  }, [updateSlot]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /* ---------- Validação ---------- */
  const validate = () => {
    const e = {};

    if (form.nome.trim().split(/\s+/).length < 2) {
      e.nome = 'Informe seu nome completo.';
    }
    if (!isValidEmail(form.email.trim())) {
      e.email = 'Informe um e-mail válido.';
    }
    if (!isValidCpf(form.cpf)) {
      e.cpf = 'CPF inválido.';
    }
    if (form.mfa.length !== 5) {
      e.mfa = 'O código MFA tem 5 dígitos.';
    }
    if (!aceiteTermos) {
      e.termos = 'É necessário aceitar os Termos de Uso e a Política de Privacidade.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (saving) return;
    setSubmitError('');

    if (!validate()) return;

    setSaving(true);

    const result = await cadastrarUsuario({
      nome: form.nome.trim(),
      email: form.email.trim(),
      cpf: form.cpf.replace(/\D/g, ''),
      mfa: form.mfa,
      consentimentos: {
        termosEPrivacidade: aceiteTermos,
        comunicacoes: aceiteNovidades,
        aceitoEm: new Date().toISOString(),
      },
    });

    if (!result.success) {
      setSubmitError(result.message || 'Não foi possível salvar seus dados. Tente novamente.');
      setSaving(false);
      return;
    }

    /* Sucesso → transição fluida do card antes de navegar */
    const cardEl = cardRef.current;
    if (cardEl && cardEl.animate) {
      const anim = cardEl.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(24px)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
      );
      anim.onfinish = () => navigate('/login');
    } else {
      navigate('/login');
    }
  };

  /* ---------- Navegação suave para Login ---------- */
  const handleGoToLogin = (e) => {
    e.preventDefault();
    if (navigating) return;
    setNavigating(true);

    const cardEl = cardRef.current;
    if (cardEl && cardEl.animate) {
      const anim = cardEl.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(24px)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
      );
      anim.onfinish = () => navigate('/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
    <div className="page">
      {/* Lado Esquerdo: Hero & Esfera 3D */}
      <section className="hero">
        <h1>
          Cadastro e <br />
          consentimento
        </h1>
        <p className="hero-desc">
          Preencha seus dados e revise como vamos utilizá-los. Você pode alterar suas
          permissões a qualquer momento.
        </p>
        <div ref={orbSlotRef} className="orb-slot" aria-hidden="true" />
      </section>

      {/* Lado Direito: Card de Cadastro */}
      <section className="wrap">
        <form className="card cad-card" ref={cardRef} onSubmit={handleSubmit} noValidate>
          <div className="cad-head">
            <h2>Seus dados</h2>
            <p>Todos os campos são obrigatórios.</p>
          </div>

          {submitError && <div className="login-error">{submitError}</div>}

          {/* Nome completo */}
          <div className={`cad-field ${errors.nome ? 'has-error' : ''}`}>
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder="Como aparece no seu documento"
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              aria-invalid={!!errors.nome}
            />
            {errors.nome && <span className="cad-err">{errors.nome}</span>}
          </div>

          {/* E-mail */}
          <div className={`cad-field ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="cad-email">E-mail</label>
            <input
              id="cad-email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className="cad-err">{errors.email}</span>}
          </div>

          {/* CPF */}
          <div className={`cad-field ${errors.cpf ? 'has-error' : ''}`}>
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setField('cpf', maskCpf(e.target.value))}
              aria-invalid={!!errors.cpf}
            />
            {errors.cpf && <span className="cad-err">{errors.cpf}</span>}
          </div>

          {/* Código MFA */}
          <div className={`cad-field cad-field--short ${errors.mfa ? 'has-error' : ''}`}>
            <label htmlFor="cad-mfa">Código MFA</label>
            <input
              id="cad-mfa"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="00000"
              value={form.mfa}
              onChange={(e) => setField('mfa', e.target.value.replace(/\D/g, '').slice(0, 5))}
              aria-invalid={!!errors.mfa}
            />
            {errors.mfa && <span className="cad-err">{errors.mfa}</span>}
          </div>

          {/* Consentimentos */}
          <label className="cad-check">
            <input
              type="checkbox"
              checked={aceiteTermos}
              onChange={(e) => {
                setAceiteTermos(e.target.checked);
                if (errors.termos) setErrors((prev) => ({ ...prev, termos: '' }));
              }}
            />
            <span className="cad-box" aria-hidden="true" />
            <span>
              Li e concordo com os <a href="#termos" className="link">Termos de Uso</a> e com a{' '}
              <a href="#privacidade" className="link">Política de Privacidade</a>.
            </span>
          </label>
          {errors.termos && <span className="cad-err cad-err--check">{errors.termos}</span>}

          <label className="cad-check">
            <input
              type="checkbox"
              checked={aceiteNovidades}
              onChange={(e) => setAceiteNovidades(e.target.checked)}
            />
            <span className="cad-box" aria-hidden="true" />
            <span>Aceito receber novidades e comunicações da NEOCORE (opcional).</span>
          </label>

          <button type="submit" className="submit cad-submit" disabled={saving}>
            {saving ? 'SALVANDO...' : 'Salvar e continuar'}
          </button>

          <p className="signup" style={{ marginTop: '10px' }}>
            Já possui uma conta?{' '}
            <a href="/login" className="link" onClick={handleGoToLogin}>
              Fazer login
            </a>
          </p>

          {/* Aviso LGPD */}
          <div className="cad-notice" role="note">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>Seus dados são tratados conforme a LGPD (Lei nº 13.709/2018).</span>
          </div>
        </form>
      </section>
    </div>
    </>
  );
}
