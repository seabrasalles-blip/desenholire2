export function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: (ev: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-1 shadow-sm transition-all border-2 ${
        active
          ? "bg-[#FFF2DC] border-[#DC8F20] scale-105"
          : "bg-white border-transparent hover:border-[#004ECC]"
      }`}
    >
      <span
        className={`[&_svg]:w-4 [&_svg]:h-4 md:[&_svg]:w-5 md:[&_svg]:h-5 ${
          active ? "text-[#DC8F20] scale-110" : "text-[#0035BB]"
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[9px] md:text-[10px] font-semibold leading-tight max-h-[640px]:hidden ${
          active ? "text-[#DC8F20]" : "text-[#00113C]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
