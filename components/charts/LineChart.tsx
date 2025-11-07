import React, { useRef, useState } from 'react';

interface ChartDataset {
  label: string;
  data: number[];
  color: string;
}

interface TooltipData {
    index: number;
    datasets: { label: string; value: number; color: string }[];
}

interface LineChartProps {
  labels: string[];
  datasets: ChartDataset[];
  onHover?: (state: { visible: boolean; data: TooltipData; x: number; y: number } | null) => void;
}

const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1).replace('.', ',') + 'k';
    }
    return value.toLocaleString('pt-BR');
};

export const LineChart: React.FC<LineChartProps> = ({ labels, datasets, onHover }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!datasets || datasets.length === 0 || labels.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400">Sem dados para exibir</div>;
  }
  
  const allData = datasets.flatMap(ds => ds.data);
  const minValue = Math.min(...allData, 0);
  const maxValue = Math.max(...allData, 0);
  const rangePadding = (maxValue - minValue) * 0.1 || 10;
  const paddedMin = minValue - rangePadding;
  const paddedMax = maxValue + rangePadding;
  const range = (paddedMax - paddedMin) || 1; 

  const yAxisLabelsCount = 5;
  const zeroLineY = 100 - ((0 - paddedMin) / range) * 100;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || !onHover) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const index = Math.round((x / width) * (labels.length - 1));

    if (index !== activeIndex) {
        setActiveIndex(index);

        const tooltipData: TooltipData = {
            index,
            datasets: datasets.map(ds => ({
                label: ds.label,
                value: ds.data[index],
                color: ds.color,
            }))
        };
        
        const pointX = (index / (labels.length - 1)) * width;
        const highestPointY = datasets.reduce((minY, ds) => {
            const y = 100 - ((ds.data[index] - paddedMin) / range) * 100;
            return Math.min(minY, y);
        }, 100);
        
        onHover({ 
            visible: true, 
            data: tooltipData, 
            x: rect.left + pointX, 
            y: rect.top + (highestPointY / 100) * rect.height
        });
    }
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    if (onHover) onHover(null);
  };
  
  return (
    <div className="w-full h-full flex" style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>
        <div className="h-full flex flex-col justify-between pr-2 text-slate-400 text-right">
            {Array.from({ length: yAxisLabelsCount + 1 }).map((_, i) => {
                const value = paddedMax - (range / yAxisLabelsCount) * i;
                return <div key={i}>{formatCurrency(value)}</div>
            })}
        </div>
        <div 
            ref={chartRef}
            className="w-full h-full flex flex-col relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Y-Axis grid lines */}
                {Array.from({ length: yAxisLabelsCount + 1 }).map((_, i) => (
                    <line key={i} x1="0" y1={(i / yAxisLabelsCount) * 100} x2="100" y2={(i / yAxisLabelsCount) * 100} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.2" />
                ))}

                {/* Zero line */}
                {paddedMin < 0 && zeroLineY > 0 && zeroLineY < 100 &&
                  <line x1="0" y1={zeroLineY} x2="100" y2={zeroLineY} stroke="#94a3b8" strokeWidth="0.3" strokeDasharray="2,2"/>
                }
                
                {/* Data lines and points */}
                {datasets.map(dataset => (
                    <g key={dataset.label}>
                        <polyline
                            fill="none"
                            stroke={dataset.color}
                            strokeWidth="0.5"
                            points={dataset.data.map((value, index) => {
                                const x = (index / (labels.length - 1)) * 100;
                                const y = 100 - ((value - paddedMin) / range) * 100;
                                return `${x},${y}`;
                            }).join(' ')}
                        />
                        {dataset.data.map((value, index) => {
                            const x = (index / (labels.length - 1)) * 100;
                            const y = 100 - ((value - paddedMin) / range) * 100;
                            return <circle key={index} cx={x} cy={y} r="1" fill={dataset.color} opacity={activeIndex === index ? 1 : 0.5} />;
                        })}
                    </g>
                ))}

                {/* Hover Indicator */}
                {activeIndex !== null && (
                     <line 
                        x1={(activeIndex / (labels.length - 1)) * 100} 
                        y1="0" 
                        x2={(activeIndex / (labels.length - 1)) * 100} 
                        y2="100" 
                        stroke="#94a3b8" 
                        strokeWidth="0.2" 
                    />
                )}
            </svg>
             <div className="w-full flex justify-around absolute -bottom-5 px-1">
              {labels.map((label, index) => <div key={index} className="text-slate-400 text-center text-xs truncate" title={label}>{label}</div>)}
            </div>
        </div>
    </div>
  );
};