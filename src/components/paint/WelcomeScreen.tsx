import { ArrowRight, Pencil } from "lucide-react";
import paintLogo from "@/assets/paint-logo.png";
import welcomeIllustration from "@/assets/welcome-illustration.png";

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#F5F8FF] via-white to-[#E6EEFB]">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(0,17,60,0.25)] border border-[#E6EEFB] overflow-hidden">
        <div className="grid md:grid-cols-2 gap-4 p-6 sm:p-8 md:p-10 items-center">
          <div className="flex flex-col gap-4 md:gap-5 order-2 md:order-1">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#E6EEFB] flex items-center justify-center shadow-sm">
                <img src={paintLogo} alt="" className="w-9 h-9" />
              </div>
            </div>
            <div>
              <h1 className="font-bold leading-[0.95] tracking-tight">
                <span className="block text-3xl sm:text-4xl md:text-5xl text-[#00113C]">
                  Ateliê de
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl text-[#0035BB]">
                  Desenho
                </span>
              </h1>
            </div>
            <p className="text-[#A000A0] font-semibold text-base sm:text-lg">
              Solte a imaginação e crie seu desenho!
            </p>
            <p className="text-[#1B6CA7] text-sm sm:text-base">
              Escolha uma ferramenta, uma cor<br className="hidden sm:inline" /> e comece a desenhar.
            </p>
            <button
              onClick={onStart}
              className="group mt-2 inline-flex items-center justify-between gap-3 self-start rounded-full bg-[#0035BB] hover:bg-[#002a96] text-white font-semibold px-6 py-4 sm:px-8 sm:py-5 text-base sm:text-lg shadow-[0_10px_25px_-8px_rgba(0,53,187,0.6)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DC8F20]"
              aria-label="Começar a desenhar"
            >
              <span className="pl-2">Começar</span>
              <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#0035BB] group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>

            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#FFF8EE] border border-[#F4DCB0] p-3 sm:p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#FFF2DC] flex items-center justify-center text-xl shrink-0">
                ☀️
              </div>
              <div className="text-sm leading-snug">
                <p className="font-bold text-[#DC8F20]">Desafio de hoje:</p>
                <p className="text-[#00113C]">desenhe algo que te faz feliz!</p>
              </div>
              <Pencil className="hidden sm:block w-5 h-5 text-[#DC8F20] ml-auto shrink-0" />
            </div>
          </div>

          <div className="order-1 md:order-2 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,53,187,0.08),transparent_70%)] rounded-full" />
            <img
              src={welcomeIllustration}
              alt="Ilustração de paleta de pintura e materiais"
              className="relative w-full max-w-sm md:max-w-md drop-shadow-[0_15px_25px_rgba(0,17,60,0.15)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
