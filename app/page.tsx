import { Fleur_De_Leah } from "next/font/google";
const fleur = Fleur_De_Leah({ weight: "400" })
export default function Home() {
  return (
    <div className={fleur.className}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-9xl text-blue-700 font-medium">
          Axiom
        </h1>
      </div></div>
  );
}
