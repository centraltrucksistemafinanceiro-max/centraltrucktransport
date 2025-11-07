import React from 'react';

interface BarData {
  id: string;
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarData[];
  onHover?: (state: { visible: boolean; data: BarData | null; x: number; y: number } | null) => void;
}

const formatCurrency = (value: number) => {
    if(Math.abs(value) >= 1000) return (value / 1000).toFixed(1).replace('.',',') + 'k';
    return value.toFixed(0);
};

export const BarChart: React.FC<BarChartProps> = ({ data, onHover }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400">Sem dados para exibir</div>;
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 0.01);
  const hasNegativeValues = data.some(d => d.value < 0);
  const range = hasNegativeValues ? maxValue * 2 : maxValue;
  const zeroPoint = hasNegativeValues ? 50 : 0;
  
  const yAxisLabelsCount = 5;
  const yAxisValues = Array.from({ length: yAxisLabelsCount + 1 }, (_, i) => {
    const value = (maxValue / yAxisLabelsCount) * i;
    return { value, label: formatCurrency(value) };
  });

  const handleMouseOver = (e: React.MouseEvent, item: BarData) => {
    if (!onHover) return;
    const bar = e.currentTarget as HTMLDivElement;
    const rect = bar.getBoundingClientRect();
    const isPositive = item.value >= 0;
    onHover({ visible: true, data: item, x: rect.left + rect.width / 2, y: isPositive ? rect.top : rect.bottom });
  };
  
  const handleMouseLeave = () => {
    if (onHover) onHover(null);
  };

  return (
    <div className="w-full h-full flex" style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>
      <div className="h-full flex flex-col justify-between pr-2 text-slate-400 text-right">
        {yAxisValues.map(({ label }, index) => <div key={`pos-${index}`}>{label}</div>).reverse()}
        {hasNegativeValues && <div key="zero">0</div>}
        {hasNegativeValues && yAxisValues.slice(1).map(({ label }, index) => <div key={`neg-${index}`}>-{label}</div>)}
      </div>
      <div className="w-full h-full flex flex-col relative border-l border-b border-slate-700">
        {/* Y-Axis grid lines */}
        {yAxisValues.map((_, i) => (
             <div key={`grid-${i}`} className="absolute w-full border-t border-slate-700/50" style={{ bottom: `${(i / yAxisLabelsCount) * (hasNegativeValues ? 50 : 100)}%` }}></div>
        ))}
         {hasNegativeValues && yAxisValues.map((_, i) => (
             <div key={`grid-neg-${i}`} className="absolute w-full border-t border-slate-700/50" style={{ top: `${(i / yAxisLabelsCount) * 50}%` }}></div>
        ))}

        <div className="w-full h-full flex justify-around items-end" onMouseLeave={handleMouseLeave}>
            {data.map((item) => {
                const heightPercentage = (Math.abs(item.value) / range) * 100;
                const isPositive = item.value >= 0;
                return (
                    <div
                        key={item.id}
                        onMouseOver={(e) => handleMouseOver(e, item)}
                        className={`w-3/4 max-w-[40px] transition-all duration-200 hover:opacity-100 opacity-80 rounded-t-sm`}
                        style={{ 
                            height: `${heightPercentage}%`,
                            backgroundColor: isPositive ? '#10B981' : '#EF4444', // green-500, red-600
                            transform: `translateY(${isPositive ? 0 : '100%'})`,
                            alignSelf: isPositive ? 'flex-end' : 'flex-start',
                            marginBottom: hasNegativeValues && isPositive ? `${zeroPoint}%` : 0,
                            marginTop: hasNegativeValues && !isPositive ? `${zeroPoint}%` : 0
                        }}
                    >
                    </div>
                );
            })}
        </div>
        {hasNegativeValues && <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-slate-500" />}
        <div className="w-full flex justify-around pt-2 text-slate-400">
          {data.map(item => <div key={item.id} className="w-10 text-center truncate" title={item.label}>{item.label}</div>)}
        </div>
      </div>
    </div>
  );
};