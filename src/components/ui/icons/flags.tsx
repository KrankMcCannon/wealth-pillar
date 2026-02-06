import React from 'react';

export const ITFlag = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 640 480" {...props}>
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#fff" d="M0 0h640v480H0z" />
      <path fill="#009246" d="M0 0h213.3v480H0z" />
      <path fill="#ce2b37" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

export const USFlag = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 640 480" {...props}>
    <path fill="#bd3d44" d="M0 0h640v480H0" />
    <path
      stroke="#fff"
      strokeWidth="37"
      d="M0 55.3h640M0 129h640M0 202.8h640M0 276.5h640M0 350.2h640M0 423.9h640"
    />
    <path fill="#192f5d" d="M0 0h244.8v221.4H0z" />
    <path
      fill="#fff"
      d="M239.8 4.6L234 8.7l2.2-6.8-5.8 4.2 2.2-6.8-5.8 4.1 2.2-6.7-5.8 4.2 2.2-6.8-5.9 4.2 2.3-6.8-5.9 4.2 2.3-6.8-5.9 4.2 2.3-6.8-5.9 4.2 2.3-6.8M27.2 201.2L21.4 205.4l2.2-6.8-5.8 4.2 2.2-6.8-5.8 4.1 2.2-6.7-5.8 4.2 2.2-6.8-5.9 4.2 2.3-6.8-5.9 4.2 2.3-6.8-5.9 4.2 2.3-6.8-5.9 4.2 2.3-6.8"
    />
    {/* Simplified US flag for icon size - Full svg is too large, this is a placeholder/approximation if needed or use full */}
  </svg>
);

export const GBFlag = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 640 480" {...props}>
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path
      fill="#FFF"
      d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"
    />
    <path
      fill="#C8102E"
      d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
    />
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
  </svg>
);

// Minimal SVGs for icon use
export const FlagIcon = ({
  countryCode,
  className,
}: { countryCode: string } & React.SVGProps<SVGSVGElement>) => {
  // We can implement a proper mapping here
  return <span className={className}>{countryCode}</span>;
};
