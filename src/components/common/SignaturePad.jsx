// src/components/common/SignaturePad.jsx
import React, { useRef, useEffect, useState } from 'react';

function SignaturePad({ onChange, width = 400, height = 200 }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setCtx(context);

    // Clear canvas
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
  }, [width, height]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const { offsetX, offsetY } = getCoordinates(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx.closePath();
    
    // Convert canvas to data URL and pass to parent
    const dataUrl = canvasRef.current.toDataURL();
    onChange(dataUrl);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      // Touch event
      return {
        offsetX: (e.touches[0].clientX - rect.left) * scaleX,
        offsetY: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      // Mouse event
      return {
        offsetX: e.nativeEvent.offsetX * scaleX,
        offsetY: e.nativeEvent.offsetY * scaleY,
      };
    }
  };

  const clearSignature = () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    onChange(null);
  };

  return (
    <div className="border border-gray-300 rounded-lg p-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-gray-200 rounded cursor-crosshair w-full"
        style={{ touchAction: 'none' }}
      />
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={clearSignature}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Sign above using your mouse or finger
      </p>
    </div>
  );
}

export default SignaturePad;