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
 * Calcula métricas agregadas de trechos
 */
export const calculateTrechoMetrics = (trechos: Trecho[], totalLiters: number, totalKm: number) => {
  const carregadoTrechos = trechos.filter(t => t.status === TrechoStatus.CARREGADO);
  const vazioTrechos = trechos.filter(t => t.status === TrechoStatus.VAZIO);

  const kmCarregado = carregadoTrechos.reduce((sum, t) => sum + calculateTrechoKm(t), 0);
  const kmVazio = vazioTrechos.reduce((sum, t) => sum + calculateTrechoKm(t), 0);

  // Média geral
  const mediaGeral = totalLiters > 0 && totalKm > 0 ? (totalKm / totalLiters).toFixed(2) : '0.00';

  // Distribuição proporcional de combustível por trecho
  const proporcaoCarregado = totalKm > 0 ? kmCarregado / totalKm : 0;
  const proporcaoVazio = totalKm > 0 ? kmVazio / totalKm : 0;

  const litrosCarregado = totalLiters * proporcaoCarregado;
  const litrosVazio = totalLiters * proporcaoVazio;

  // Média por tipo de trecho
  const mediaCarregado = litrosCarregado > 0 && kmCarregado > 0 ? (kmCarregado / litrosCarregado).toFixed(2) : '0.00';
  const mediaVazio = litrosVazio > 0 && kmVazio > 0 ? (kmVazio / litrosVazio).toFixed(2) : '0.00';

  return {
    kmCarregado,
    kmVazio,
    litrosCarregado,
    litrosVazio,
    mediaCarregado: parseFloat(mediaCarregado),
    mediaVazio: parseFloat(mediaVazio),
    mediaGeral: parseFloat(mediaGeral),
  };
};

/**
 * Função helper para distribuir combustível por trecho
 * Retorna objeto com combustível esperado para cada trecho
 */
export const distributeFuelByTrecho = (trechos: Trecho[], mediaGeral: number) => {
  return trechos.reduce((acc, trecho) => {
    const km = calculateTrechoKm(trecho);
    const combustivel = calculateFuelForTrecho(km, mediaGeral);
    acc[trecho.id] = combustivel;
    return acc;
  }, {} as Record<string, number>);
};
