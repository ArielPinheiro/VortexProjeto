import React, { useEffect } from 'react';
import { useOrb } from './OrbContext';
import DashboardContatos from '../components/Dashboard/DashboardContatos';

export default function Dashboard() {
  const { setSlotRect } = useOrb();

  useEffect(() => {
    // Garante que a classe dark-bg do login seja removida para a estética clara do painel
    document.body.classList.remove('dark-bg');
    // Limpa o slot do globo — ele não aparece no dashboard
    setSlotRect(null);
  }, [setSlotRect]);

  return <DashboardContatos />;
}
