import { Trip, Trecho, TrechoStatus } from '../types';

/**
 * Calcula o combustível esperado para cada trecho baseado na média geral
 * dieselTrecho = kmTrecho ÷ mediaGeral
 */
export const calculateFuelForTrecho = (kmTrecho: number, mediaGeral: number): number => {
  if (mediaGeral <= 0) return 0;
  return kmTrecho / mediaGeral;
};

/**
 * Calcula a quilometragem de um trecho
 */
export const calculateTrechoKm = (trecho: Trecho): number => {
  return Math.max(0, trecho.kmFinal - trecho.kmInicial);
};

/**
 * Calcula métricas agregadas de trechos com estimativas baseadas em Scania R440
 * 
 * LÓGICA:
 * 1. mediaGeral = kmTotal / litrosTotais (REAL - não altera)
 * 2. Calcula percentuais de km carregado e vazio
 * 3. Estima médias usando faixas Scania R440 + interpolação
 * 4. Estima combustível por trecho e gera indicadores de eficiência
 */
export const calculateTrechoMetrics = (trechos: Trecho[] = [], totalLiters: number, totalKm: number) => {
  const safeTrechos = trechos || [];
  const carregadoTrechos = safeTrechos.filter(t => t.status === TrechoStatus.CARREGADO);
  const vazioTrechos = safeTrechos.filter(t => t.status === TrechoStatus.VAZIO);

  const kmCarregado = carregadoTrechos.reduce((sum, t) => sum + calculateTrechoKm(t), 0);
  const kmVazio = vazioTrechos.reduce((sum, t) => sum + calculateTrechoKm(t), 0);

  // ✔️ 1. Média geral (REAL) - mantém o cálculo original
  const mediaGeral = totalLiters > 0 && totalKm > 0 ? totalKm / totalLiters : 0;

  // ✔️ 2. Calcular percentuais dos trechos
  const percentualCarregado = totalKm > 0 ? kmCarregado / totalKm : 0;
  const percentualVazio = totalKm > 0 ? kmVazio / totalKm : 0;

  // ✔️ 3. Faixas Scania R440 (referências para estimativa)
  const MIN_CARREGADO = 2.8;
  const MAX_CARREGADO = 3.4;
  const MIN_VAZIO = 4.0;
  const MAX_VAZIO = 5.2;

  // ✔️ 4. Calcular médias ESTIMADAS com interpolação
  // As médias variam entre min e max proporcionalmente ao percentual de km rodado
  const mediaCarregadoEstimado = MIN_CARREGADO + (percentualCarregado * (MAX_CARREGADO - MIN_CARREGADO));
  const mediaVazioEstimado = MIN_VAZIO + (percentualVazio * (MAX_VAZIO - MIN_VAZIO));

  // Estimar litros por segmento usando as médias estimadas
  const litrosCarregadoEstimado = mediaCarregadoEstimado > 0 ? kmCarregado / mediaCarregadoEstimado : 0;
  const litrosVazioEstimado = mediaVazioEstimado > 0 ? kmVazio / mediaVazioEstimado : 0;

  // ✔️ 6. Indicadores de eficiência
  const indicatorCarregado = mediaCarregadoEstimado < MIN_CARREGADO
    ? 'abaixo do esperado'
    : mediaCarregadoEstimado > MAX_CARREGADO
      ? 'acima do esperado'
      : 'dentro do esperado';

  const indicatorVazio = mediaVazioEstimado < MIN_VAZIO
    ? 'abaixo do esperado'
    : mediaVazioEstimado > MAX_VAZIO
      ? 'acima do esperado'
      : 'dentro do esperado';

  return {
    // ✔️ 5. Campos exibidos no relatório
    kmCarregado,
    kmVazio,
    percentualCarregado,
    percentualVazio,
    litrosCarregadoEstimado,
    litrosVazioEstimado,
    mediaCarregadoEstimado,
    mediaVazioEstimado,
    mediaGeral,
    indicatorCarregado,
    indicatorVazio,
    // Aliases para compatibilidade com componentes existentes
    litrosCarregado: litrosCarregadoEstimado,
    litrosVazio: litrosVazioEstimado,
    mediaCarregado: mediaCarregadoEstimado,
    mediaVazio: mediaVazioEstimado,
  };
};

/**
 * Função helper para distribuir combustível por trecho
 * Retorna objeto com combustível esperado para cada trecho
 */
export const distributeFuelByTrecho = (trechos: Trecho[] = [], mediaGeral: number) => {
  const safeTrechos = trechos || [];
  return safeTrechos.reduce((acc, trecho) => {
    const km = calculateTrechoKm(trecho);
    const combustivel = calculateFuelForTrecho(km, mediaGeral);
    acc[trecho.id] = combustivel;
    return acc;
  }, {} as Record<string, number>);
};
