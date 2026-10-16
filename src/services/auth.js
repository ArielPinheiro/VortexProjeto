/**
 * Simula uma requisição de login.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  TODO: Substituir pela chamada à API real.                         │
 * │                                                                    │
 * │  Exemplo:                                                          │
 * │    const res = await fetch('/api/auth/login', {                    │
 * │      method: 'POST',                                              │
 * │      headers: { 'Content-Type': 'application/json' },             │
 * │      body: JSON.stringify({ email, senha, mfa }),                  │
 * │    });                                                             │
 * │    if (!res.ok) return { success: false, message: 'Falha' };       │
 * │    return res.json(); // { success: true, token: '...' }           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export async function fazerLogin(email, senha, mfa) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}
