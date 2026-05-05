import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  reason?: "milestone" | "legacy_tier" | string | null;
  className?: string;
  size?: "sm" | "md";
};

const LegacySecuredBadge = ({ reason, className, size = "md" }: Props) => {
  const { lang } = useI18n();
  const label = lang === "ru" ? "Наследие сохранено" : "Legacy Secured";

  const tooltip =
    reason === "legacy_tier"
      ? lang === "ru"
        ? "Тариф «Legacy» — данные сохраняются навсегда"
        : "Legacy tier — your data is preserved forever"
      : lang === "ru"
      ? "50+ записей — данные защищены навсегда"
      : "50+ entries — your data is preserved forever";

  return (
    <div
      title={tooltip}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      <ShieldCheck size={size === "sm" ? 11 : 13} />
      <span>{label}</span>
    </div>
  );
};

export default LegacySecuredBadge;