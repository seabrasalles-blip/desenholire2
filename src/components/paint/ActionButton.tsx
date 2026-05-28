export function ActionButton({
  icon,
  label,
  onClick,
  variant = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
}) {
  const styles =
    variant === "primary"
      ? "bg-[#0035BB] hover:bg-[#002a96] text-white border-2 border-[#0035BB]"
      : variant === "secondary"
      ? "bg-white text-[#00113C] border-2 border-[#1B6CA7] hover:bg-[#E6EEFB]"
      : "bg-white text-[#DC8F20] border-2 border-[#DC8F20] hover:bg-[#FFF2DC]";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold shadow-sm transition-transform hover:scale-105 [&_svg]:w-4 [&_svg]:h-4 ${styles}`}
    >
      {icon}
      {label}
    </button>
  );
}
