import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface NrruCrestProps {
  className?: string;
}

export const NrruCrest: React.FC<NrruCrestProps> = ({ className = 'w-11 h-11' }) => {
  return (
    <img
      src="/public/assets/aistudio/LOGo_iA_2020-03_a339421c.svg"
      alt="ตราสัญลักษณ์สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏนครราชสีมา (iA NRRU)"
      className={`${className} object-contain shrink-0 drop-shadow-sm select-none`}
      width={48}
      height={48}
    />
  );
};

interface DynamicQrSvgProps {
  value: string;
  size?: number;
}

export const DynamicQrSvg: React.FC<DynamicQrSvgProps> = ({ value, size = 208 }) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toString(
      value,
      {
        type: 'svg',
        margin: 1,
        width: size,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#020617',
          light: '#FFFFFF',
        },
      },
      (err, str) => {
        if (!err && active && str) {
          setSvgMarkup(str);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!svgMarkup) {
    return (
      <div
        className="flex items-center justify-center bg-white rounded-xl animate-pulse"
        style={{ width: size, height: size }}
      >
        <span className="text-xs font-mono text-slate-500">QR...</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center bg-white p-3 rounded-2xl">
      <div
        className="w-48 h-48 sm:w-52 sm:h-52 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
        role="img"
        aria-label={`รหัส QR สำหรับเช็คชื่อ: ${value}`}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-9 h-9 rounded-lg bg-slate-950 border-2 border-white flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-mono font-bold tracking-tight text-amber-400">NRRU</span>
        </div>
      </div>
    </div>
  );
};
