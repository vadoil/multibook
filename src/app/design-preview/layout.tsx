import { Caveat, Cormorant_Garamond, Golos_Text } from "next/font/google";
import "./concepts.css";
import "./identity.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-concept-sans",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-concept-serif",
});
const caveat = Caveat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-concept-hand",
});

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mc-preview ${golos.variable} ${cormorant.variable} ${caveat.variable}`}
    >
      {children}
    </div>
  );
}
