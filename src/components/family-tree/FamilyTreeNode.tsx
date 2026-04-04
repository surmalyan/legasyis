import { Users, Check, X, Clock, Trash2 } from "lucide-react";

interface FamilyTreeNodeProps {
  name: string;
  relationship: string;
  birthYear?: number | null;
  deathYear?: number | null;
  notes?: string | null;
  geneticConditions?: string | null;
  avatarUrl?: string | null;
  avatarUrl?: string | null;
  status?: "local" | "pending" | "confirmed";
  isCenter?: boolean;
  onDelete?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

const FamilyTreeNode = ({
  name,
  relationship,
  birthYear,
  deathYear,
  notes,
  geneticConditions,
  avatarUrl,
  status = "local",
  isCenter = false,
  onDelete,
  onAccept,
  onReject,
}: FamilyTreeNodeProps) => {
  const borderColor =
    status === "confirmed"
      ? "border-green-500/50 ring-1 ring-green-500/20"
      : status === "pending"
      ? "border-amber-500/50 ring-1 ring-amber-500/20"
      : isCenter
      ? "border-primary ring-2 ring-primary/20"
      : "border-border";

  const avatarBg =
    status === "confirmed"
      ? "bg-green-500/10 text-green-600"
      : status === "pending"
      ? "bg-amber-500/10 text-amber-600"
      : isCenter
      ? "bg-primary/20 text-primary"
      : "bg-primary/10 text-primary";

  return (
    <div
      className={`relative bg-card border-2 ${borderColor} rounded-2xl p-3 min-w-[140px] max-w-[180px] transition-all hover:shadow-lg group select-none`}
    >
      {/* Status badge */}
      {status === "pending" && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center z-10">
          <Clock size={10} className="text-white" />
        </div>
      )}
      {status === "confirmed" && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-10">
          <Check size={10} className="text-white" />
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-2">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-background shadow-md"
          />
        ) : (
          <div className={`w-14 h-14 rounded-full ${avatarBg} flex items-center justify-center shadow-sm`}>
            <Users size={22} />
          </div>
        )}
        <div className="min-w-0 w-full">
          <p className="text-xs font-bold text-foreground truncate">{name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {relationship}
          </p>
          {(birthYear || deathYear) && (
            <p className="text-[10px] text-muted-foreground">
              {birthYear || "?"}
              {deathYear ? ` – ${deathYear}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-1 mt-2">
        {onAccept && status === "pending" && (
          <button onClick={onAccept} className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
            <Check size={12} />
          </button>
        )}
        {onReject && status === "pending" && (
          <button onClick={onReject} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
            <X size={12} />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {notes && (
        <p className="text-[9px] text-muted-foreground italic mt-1 text-center line-clamp-2">
          {notes}
        </p>
      )}
      {geneticConditions && (
        <p className="text-[9px] text-destructive/80 mt-1 text-center line-clamp-2 flex items-center justify-center gap-0.5">
          🧬 {geneticConditions}
        </p>
      )}
    </div>
  );
};

export default FamilyTreeNode;
