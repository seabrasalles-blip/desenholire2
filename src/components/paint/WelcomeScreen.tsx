import { ArrowRight, Pencil } from "lucide-react";
import paintLogo from "@/assets/paint-logo.png";
import welcomeIllustration from "@/assets/welcome-illustration.png";

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-dvh w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-gradient-to-br from-[#F5F8FF] via-white to-[#E6EEFB]">
      <div className="w-full max-w-5xl max-h-full rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(0,17,60,0.25)] border border-[#E6EEFB] overflow-hidden flex">
        <div className="grid md:grid-cols-2 gap-3 p-4 sm:p-6 md:p-8 items-center w-full">
          <div className="flex flex-col gap-2 md:gap-3 order-2 md:order-1 min-h-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E6EEFB] flex items-center justify-center shadow-sm shrink-0">
                <img src={paintLogo} alt="" className="w-7 h-7" />
              </div>
            </div>
            <div>
              <h1 className="font-bold leading-[0.95] tracking-tight">
                <span
                  className="block text-[#00113C]"
                  style={{ fontSize: "clamp(1.5rem, 4vh + 0.25rem, 3rem)" }}
                >
                  Ateliê de
                </span>
                <span
                  className="block text-[#0035BB]"
                  style={{ fontSize: "clamp(1.875rem, 5.5vh, 3.75rem)" }}
                >
                  Desenho
                </span>
              </h1>
            </div>
            <p
              className="text-[#A000A0] font-semibold"
              style={{ fontSize: "clamp(0.875rem, 1.6vh + 0.4rem, 1.125rem)" }}
            >
              Solte a imaginação e crie seu desenho!
            </p>
            <p
              className="text-[#1B6CA7] max-[800px]:hidden"
              style={{ fontSize: "clamp(0.8rem, 1.4vh + 0.35rem, 1rem)" }}
            >
              Escolha uma ferramenta, uma cor e comece a desenhar.
            </p>
            <button
              onClick={onStart}
              className="group inline-flex items-center justify-between gap-3 self-start rounded-full bg-[#0035BB] hover:bg-[#002a96] text-white font-semibold px-5 py-3 sm:px-6 sm:py-3.5 text-base sm:text-lg shadow-[0_10px_25px_-8px_rgba(0,53,187,0.6)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DC8F20]"
              aria-label="Começar a desenhar"
            >
              <span className="pl-1">Começar</span>
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#0035BB] group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>

            <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8EE] border border-[#F4DCB0] p-2.5 sm:p-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#FFF2DC] flex items-center justify-center text-lg shrink-0">
               ✨
              </div>
              <div className="text-sm leading-snug min-w-0">
                <p className="font-bold text-[#DC8F20]">Desafio de hoje:</p>
                <p className="text-[#00113C] truncate">Desenhe algo que te faz feliz!</p>
              </div>
              <Pencil className="hidden sm:block w-5 h-5 text-[#DC8F20] ml-auto shrink-0" />
            </div>
          </div>

          <div className="order-1 md:order-2 flex items-center justify-center relative min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,53,187,0.08),transparent_70%)] rounded-full max-[800px]:hidden" />
            <img
              src={welcomeIllustration}
              alt="Ilustração de paleta de pintura e materiais"
              className="relative w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,17,60,0.15)] max-h-[28dvh] md:max-h-[55dvh]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
