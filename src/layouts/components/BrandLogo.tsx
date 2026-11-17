interface BrandLogoProps {
  collapsed?: boolean;
}

export default function BrandLogo({ collapsed = false }: BrandLogoProps) {
  return (
    <div className={`brand-logo ${collapsed ? 'is-collapsed' : ''}`}>
      <svg className="brand-symbol" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="40" height="40" rx="12" fill="url(#brand-gradient)" />
        <path d="M12 16V12.5C12 11.12 13.12 10 14.5 10H18M24 10H27.5C28.88 10 30 11.12 30 12.5V16M30 26V29.5C30 30.88 28.88 32 27.5 32H24M18 32H14.5C13.12 32 12 30.88 12 29.5V26" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="21" cy="18" r="4" fill="white" />
        <path d="M14.8 27C15.55 23.85 17.7 22 21 22C24.3 22 26.45 23.85 27.2 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <defs>
          <linearGradient id="brand-gradient" x1="4" y1="3" x2="38" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#55D6BE" />
            <stop offset="0.48" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#3154D8" />
          </linearGradient>
        </defs>
      </svg>
      {!collapsed && (
        <div className="brand-copy">
          <strong>人脸通</strong>
          <span>一体化管理平台</span>
        </div>
      )}
    </div>
  );
}
