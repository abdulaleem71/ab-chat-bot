import React from 'react';

// Official Visa Logo SVG
export const VisaLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M38.86 3.12L25.32 30.88H16.48L9.94 8.24C9.54 6.72 9.22 6.2 8.02 5.48C6.1 4.44 2.86 3.48 0 2.84L0.2 2H14.12C15.9 2 17.44 3.2 17.82 5.08L21.28 22.84L30.04 2H38.86ZM72.96 22.12C73 13.92 61.2 13.4 61.34 9.8C61.4 8.72 62.44 7.56 64.88 7.24C66.08 7.08 69.44 6.96 73.16 8.68L74.72 2.2C72.58 1.44 69.8 0.88 66.2 0.88C57.44 0.88 51.24 5.52 51.14 12.16C51 17.08 55.38 19.8 58.74 21.44C62.2 23.12 63.36 24.2 63.32 25.72C63.24 28.04 60.48 29.08 57.96 29.12C53.92 29.16 51.56 28.04 49.68 27.2L48.08 33.88C50.04 34.76 53.64 35.52 57.4 35.56C66.8 35.56 72.92 30.92 72.96 22.12ZM95.04 2H87.16C84.72 2 82.88 2.72 81.84 5.2L69.88 30.88H79.16L81.04 25.72H92.48L93.56 30.88H101.68L95.04 2ZM83.6 18.8C84.32 16.84 87.12 9.28 87.12 9.28C87.08 9.32 87.8 11.24 88.52 14.88L89.96 21.8H83.6V18.8ZM45.68 2L38.48 30.88H47.48L54.68 2H45.68Z"
      fill="#1A1F71"
    />
  </svg>
);

// Official Mastercard Logo SVG
export const MastercardLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 100 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="30" r="28" fill="#EB001B" />
    <circle cx="65" cy="30" r="28" fill="#F79E1B" />
    <path
      d="M50 8.76001C55.7088 14.4027 59.2 21.8441 59.2 30.0802C59.2 38.3163 55.7088 45.7577 50 51.4004C44.2912 45.7577 40.8 38.3163 40.8 30.0802C40.8 21.8441 44.2912 14.4027 50 8.76001Z"
      fill="#FF5F00"
    />
  </svg>
);

// Official PayPal Logo SVG (Double P Monogram + Wordmark option)
export const PaypalLogo: React.FC<{ className?: string; showWordmark?: boolean }> = ({
  className = "h-6",
  showWordmark = true,
}) => (
  <svg viewBox="0 0 124 33" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark Blue Front P */}
    <path
      d="M9.18 3.01H1.54C0.8 3.01 0.17 3.56 0.07 4.29L0 4.81L3.92 29.61L3.97 29.98C4.05 30.54 4.53 30.95 5.09 30.95H10.15C10.74 30.95 11.24 30.5 11.33 29.91L11.37 29.62L13.15 18.35L13.2 18.02C13.29 17.46 13.77 17.05 14.33 17.05H16.89C22.61 17.05 26.31 14.28 27.22 8.79C27.63 6.33 27.02 4.41 25.48 3.19C23.82 1.88 20.89 1.18 17.18 1.18H10.82C10.08 1.18 9.45 1.73 9.35 2.46L9.18 3.01Z"
      fill="#003087"
    />
    {/* Cyan Blue Back P */}
    <path
      d="M10.82 1.18H17.18C20.89 1.18 23.82 1.88 25.48 3.19C27.02 4.41 27.63 6.33 27.22 8.79C26.31 14.28 22.61 17.05 16.89 17.05H14.33C13.77 17.05 13.29 17.46 13.2 18.02L13.15 18.35L11.37 29.62L11.33 29.91C11.24 30.5 10.74 30.95 10.15 30.95H5.09C4.53 30.95 4.05 30.54 3.97 29.98L3.92 29.61L0.07 4.29C0.17 3.56 0.8 3.01 1.54 3.01H9.18L9.35 2.46C9.45 1.73 10.08 1.18 10.82 1.18Z"
      fill="#0079C1"
      opacity="0.9"
    />
    <path
      d="M10.82 1.18H17.18C20.89 1.18 23.82 1.88 25.48 3.19C27.02 4.41 27.63 6.33 27.22 8.79C26.31 14.28 22.61 17.05 16.89 17.05H14.33C13.77 17.05 13.29 17.46 13.2 18.02L11.37 29.62L10.15 30.95H5.09L3.92 29.61L9.18 3.01L10.82 1.18Z"
      fill="#00457C"
      opacity="0.3"
    />
    {showWordmark && (
      <>
        {/* "Pay" in Dark Blue */}
        <text x="32" y="24" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="22" fontStyle="italic" fill="#003087">
          Pay
        </text>
        {/* "Pal" in Cyan Blue */}
        <text x="73" y="24" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="22" fontStyle="italic" fill="#0079C1">
          Pal
        </text>
      </>
    )}
  </svg>
);

// Official Google Pay Logo SVG (4-Color Google G + Pay)
export const GooglePayLogo: React.FC<{ className?: string; theme?: 'light' | 'dark' }> = ({
  className = "h-6",
  theme = 'light',
}) => {
  const textColor = theme === 'dark' ? '#FFFFFF' : '#3C4043';
  return (
    <svg viewBox="0 0 110 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Google G Emblem */}
      <path
        d="M14.08 14.545V18.15H22.56C22.188 20.088 20.26 23.8 14.08 23.8C8.752 23.8 4.412 19.388 4.412 14C4.412 8.612 8.752 4.2 14.08 4.2C17.116 4.2 19.144 5.498 20.308 6.61L23.164 3.86C21.328 2.148 18.012 1 14.08 1C6.904 1 1 6.822 1 14C1 21.178 6.904 27 14.08 27C21.584 27 26.564 21.722 26.564 14.288C26.564 13.376 26.468 12.69 26.312 12H14.08V14.545Z"
        fill="#4285F4"
      />
      <path
        d="M14.08 1C18.012 1 21.328 2.148 23.164 3.86L20.308 6.61C19.144 5.498 17.116 4.2 14.08 4.2C8.752 4.2 4.412 8.612 4.412 14H1V14C1 6.822 6.904 1 14.08 1Z"
        fill="#EA4335"
      />
      <path
        d="M4.412 14C4.412 19.388 8.752 23.8 14.08 23.8C20.26 23.8 22.188 20.088 22.56 18.15H14.08V14.545H26.312C26.468 12.69 26.564 13.376 26.564 14.288C26.564 21.722 21.584 27 14.08 27C6.904 27 1 21.178 1 14"
        fill="#FBBC05"
      />
      <path
        d="M1 14C1 21.178 6.904 27 14.08 27C21.584 27 26.564 21.722 26.564 14.288C26.564 13.376 26.468 12.69 26.312 12H14.08V14.545H22.56C22.188 20.088 20.26 23.8 14.08 23.8C8.752 23.8 4.412 19.388 4.412 14"
        fill="#34A853"
      />

      {/* "Pay" Text */}
      <text x="33" y="22" fontFamily="Product Sans, Roboto, Inter, sans-serif" fontWeight="700" fontSize="20" fill={textColor}>
        Pay
      </text>
    </svg>
  );
};

// Official Apple Pay Logo SVG
export const ApplePayLogo: React.FC<{ className?: string; theme?: 'light' | 'dark' }> = ({
  className = "h-6",
  theme = 'light',
}) => {
  const fillColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  return (
    <svg viewBox="0 0 110 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Apple Icon */}
      <path
        d="M11.96 10.98C11.94 8.78 13.74 7.6 13.82 7.54C12.8 6.06 11.22 5.86 10.68 5.84C9.36 5.7 8.08 6.62 7.4 6.62C6.72 6.62 5.68 5.84 4.58 5.86C3.16 5.88 1.84 6.68 1.12 7.94C-0.36 10.5 -0.04 14.3 1.4 16.38C2.1 17.38 2.94 18.52 4.02 18.48C5.06 18.44 5.46 17.82 6.72 17.82C7.98 17.82 8.34 18.48 9.44 18.46C10.56 18.44 11.28 17.42 11.96 16.42C12.76 15.26 13.08 14.14 13.1 14.08C13.06 14.06 11.98 13.64 11.96 10.98Z"
        fill={fillColor}
      />
      <path
        d="M8.88 3.88C9.46 3.18 9.84 2.22 9.74 1.24C8.9 1.28 7.84 1.8 7.24 2.5C6.72 3.1 6.26 4.08 6.38 5.04C7.32 5.12 8.3 4.58 8.88 3.88Z"
        fill={fillColor}
      />
      {/* "Pay" Text */}
      <text x="18" y="18" fontFamily="-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif" fontWeight="600" fontSize="21" fill={fillColor}>
        Pay
      </text>
    </svg>
  );
};

// Official Stripe Logo SVG
export const StripeLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 80 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M80 15.76C80 22.04 75.3 26.24 68.64 26.24C65.56 26.24 63.14 25.26 61.64 24.32L62.72 18.82C64.3 19.82 66.42 20.66 68.42 20.66C71 20.66 72.36 19.46 72.36 17.86C72.36 12.38 60.94 15.68 60.94 8.24C60.94 2.82 65.4 0 71.86 0C74.62 0 77.06 0.72 78.44 1.48L77.36 6.94C76.06 6.16 74.08 5.48 72.08 5.48C69.86 5.48 68.58 6.44 68.58 7.84C68.58 13.06 80 9.86 80 15.76ZM23.08 25.76H15.64V0.58H23.08V25.76ZM0 25.76H7.44V0.58H0V25.76ZM38.2 25.76V11.24H33.34V25.76H25.9V0.58H33.34V6.16C34.84 2.06 38.38 0 42.42 0C43.52 0 44.4 0.12 44.88 0.28L43.82 6.58C43.24 6.44 42.4 6.36 41.34 6.36C38.96 6.36 38.2 8.36 38.2 11.24ZM52.4 26.24C46.88 26.24 43.14 21.62 43.14 15.8C43.14 9.9 47.04 5.34 52.6 5.34C58.12 5.34 61.88 9.9 61.88 15.8C61.88 21.68 57.94 26.24 52.4 26.24ZM52.5 10.96C49.98 10.96 48.96 13.16 48.96 15.8C48.96 18.42 50 20.62 52.5 20.62C55 20.62 56.02 18.42 56.02 15.8C56.02 13.16 55 10.96 52.5 10.96Z"
      fill="#635BFF"
    />
  </svg>
);

// Official American Express Logo SVG
export const AmexLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <svg viewBox="0 0 100 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="60" rx="8" fill="#016FD0" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial Black, Helvetica, sans-serif" fontWeight="900" fontSize="18" fill="#FFFFFF" letterSpacing="0.5">
      AMEX
    </text>
  </svg>
);

// Official Discover Logo SVG
export const DiscoverLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="24" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="20" fill="#231F20">
      DISC
    </text>
    <circle cx="58" cy="17" r="8" fill="#FF6000" />
    <text x="68" y="24" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="20" fill="#231F20">
      VER
    </text>
  </svg>
);

// Official Shop Pay Logo SVG
export const ShopPayLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="32" rx="6" fill="#5A31F4" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" fontWeight="800" fontSize="16" fill="#FFFFFF">
      Shop Pay
    </text>
  </svg>
);
