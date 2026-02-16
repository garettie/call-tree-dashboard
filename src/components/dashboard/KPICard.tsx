import type { FC } from "react";
import {
  Users,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  subtext: string;
  color: string;
  onClick?: () => void;
  isActive?: boolean;
}

const getIcon = (label: string) => {
  switch (label) {
    case "Total Contacts":
      return Users;
    case "Responded":
      return CheckCircle;
    case "Safe":
      return ShieldCheck;
    case "Affected":
      return AlertCircle;
    case "Pending":
      return Clock;
    default:
      return Users;
  }
};

export const KPICard: FC<KPICardProps> = ({
  label,
  value,
  subtext,
  color,
  onClick,
  isActive,
}) => {
  const Icon = getIcon(label);

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 flex flex-col justify-between h-full relative overflow-hidden group transition-all duration-300 outline-none focus:outline-none ${
        onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" : ""
      } ${isActive ? "border-2" : "border border-transparent"}`}
      style={isActive ? { borderColor: color } : {}}
    >
      {/* Background Gradient Mesh */}
      <div
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150"
        style={{ backgroundColor: color }}
      />

      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-2 rounded-lg ring-1 ring-gray-100/50 shadow-sm transition-colors ${
            isActive ? "bg-white" : "bg-gray-50"
          }`}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>

      <div>
        <div className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          {value}
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </h3>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
            {subtext}
          </span>
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          isActive
            ? "h-2 opacity-100"
            : "h-1 opacity-50 group-hover:opacity-100"
        }`}
        style={{ backgroundColor: color }}
      />
    </div>
  );
};
