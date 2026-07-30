import React from "react";

interface LogoProps {
  className?: string;
}

export function DazedLogo({ className = "h-10 w-auto" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 150 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="10"
        y="32"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="34"
        fontWeight="900"
        fontStyle="italic"
        fill="white"
        stroke="black"
        strokeWidth="3.5"
        letterSpacing="2"
      >
        DazeD
      </text>
    </svg>
  );
}

export function BrixzLogo({ className = "h-10 w-auto" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 150 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="5"
        y="30"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill="none"
        stroke="#b5945b"
        strokeWidth="3"
        letterSpacing="1"
      >
        BRIXZ
      </text>
      <line x1="5" y1="35" x2="140" y2="35" stroke="#b5945b" strokeWidth="2.5" />
      <text
        x="55"
        y="43"
        fontFamily="sans-serif"
        fontSize="9"
        fontWeight="900"
        fill="#b5945b"
        letterSpacing="3"
      >
        NYC
      </text>
    </svg>
  );
}

export function ShrumfuzedLogo({ className = "h-10 w-auto" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="5"
        y="32"
        fontFamily="'Comic Sans MS', cursive, sans-serif"
        fontSize="24"
        fontWeight="900"
        fontStyle="italic"
        fill="#e0218a"
        stroke="#4a154b"
        strokeWidth="2.5"
        letterSpacing="-1"
      >
        Shrumfuzed
      </text>
    </svg>
  );
}

export function HytzLogo({ className = "h-10 w-auto" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 150 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="15"
        y="34"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="36"
        fontWeight="bold"
        fontStyle="italic"
        fill="#ffe500"
        stroke="black"
        strokeWidth="3.5"
      >
        hytz
      </text>
    </svg>
  );
}

export function MyzenOrganixLogo({ className = "h-10 w-auto" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="5"
        y="32"
        fontFamily="'Century Gothic', 'Helvetica Neue', sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="#808000"
      >
        MYzen
      </text>
      <text
        x="98"
        y="32"
        fontFamily="'Century Gothic', 'Helvetica Neue', sans-serif"
        fontSize="14"
        fontWeight="bold"
        fill="#808000"
      >
        organix
      </text>
    </svg>
  );
}

export function RoxLogo({ className = "h-10 w-auto" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 150 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="20"
        y="34"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="36"
        fontWeight="bold"
        fill="#d32f2f"
        stroke="#1976d2"
        strokeWidth="2.5"
      >
        Rõx
      </text>
    </svg>
  );
}
