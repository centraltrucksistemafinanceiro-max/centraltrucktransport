
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './Button';

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

  useEffect(() => {
    const context = getCanvasContext();
    if (context) {
      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 2;
      context.lineCap = 'round';
    }
  }, []);
  
  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    if(!canvasRef.current) return {x: 0, y: 0};
    const rect = canvasRef.current.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    if (event instanceof TouchEvent) {
        return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
    return { x: 0, y: 0};
  }

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const context = getCanvasContext();
    if (!context) return;
    const { x, y } = getCoordinates(event.nativeEvent);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing) return;
    const context = getCanvasContext();
    if (!context) return;
    const { x, y } = getCoordinates(event.nativeEvent);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    const context = getCanvasContext();
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = getCanvasContext();
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = getCanvasContext();
      if(!context) return;
      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      if (canvas.toDataURL() === blank.toDataURL()) {
        alert("Por favor, assine no campo indicado.");
        return;
      }
      onSave(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width="460"
        height="200"
        className="bg-slate-700 rounded-md cursor-crosshair w-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={clearCanvas}>Limpar</Button>
        <Button onClick={handleSave}>Salvar Assinatura</Button>
      </div>
    </div>
  );
};
