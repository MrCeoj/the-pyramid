"use client";
import { Fa1, Fa2, Fa3, Fa4, Fa5 } from "react-icons/fa6";
import { PiMedalBold } from "react-icons/pi";
import { Sword } from "lucide-react";

interface Team {
  id: number;
  categoryId: number | null;
  name: string | null;
  status: "idle" | "winner" | "looser" | "risky";
  wins: number | null;
  losses: number | null;
}

interface Position {
  id: number;
  row: number;
  col: number;
  team: Team | null;
}

interface TeamCardProps {
  data: Position;
  challengable?: boolean;
  onChallenge?: (team: Team) => void;
}

const TeamCard = ({ data, challengable = false, onChallenge }: TeamCardProps) => {
  const getIcon = (category: number) => {
    switch (category) {
      case 1:
        return <Fa1 strokeWidth={24} size={15} />;
      case 2:
        return <Fa2 strokeWidth={24} size={15} />;
      case 3:
        return <Fa3 strokeWidth={24} size={15} />;
      case 4:
        return <Fa4 strokeWidth={24} size={15} />;
      case 5:
        return <Fa5 strokeWidth={24} size={15} />;
    }
  };

  const handleChallenge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.team && onChallenge) {
      onChallenge(data.team);
    }
  };

  const statusColors: Record<Team["status"], string> = {
    looser: "bg-red-900/60 border-red-900/90 hover:bg-red-800/70",
    winner: "bg-green-900/60 border-green-900/90 hover:bg-green-800/70",
    idle: "bg-slate-900/50 border-slate-900/90 hover:bg-slate-800/60",
    risky: "bg-yellow-700/60 border-yellow-900 hover:bg-yellow-600/70"
  };

  return (
    <>
      {data.team && (
        <div className={`relative ${statusColors[data.team.status!]} border-dashed border-4 rounded-xl transition-all duration-200 p-4 min-w-[150px] max-w-[170px] backdrop-blur-sm snap-center ${
          challengable 
            ? 'hover:shadow-2xl hover:scale-[1.02] cursor-pointer border-yellow-400/50' 
            : 'hover:opacity-90'
        }`}>
          
          {/* Challenge Button */}
          {challengable && (
            <button
              onClick={handleChallenge}
              className="absolute -top-2 -right-2 cursor-pointer bg-amber-600 hover:bg-gradient-to-br from-yellow-600 to-yellow-500 via-amber-300 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
              title="Desafiar equipo"
            >
              <Sword size={16} />
            </button>
          )}

          <div className="text-center">
            <div
              className="font-bold text-base text-white truncate mb-3"
              title={data.team?.name || ""}
            >
              {data.team?.name || "Equipo sin nombre"}
            </div>
            {data.team && (
              <div className="flex flex-col">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-400 font-medium">
                    W: {data.team.wins}
                  </span>
                  <span className="text-red-400 font-medium">
                    L: {data.team.losses}
                  </span>
                  <div title="Categoría" className="relative">
                    <PiMedalBold
                      className="text-yellow-500 absolute -top-4 -left-5"
                      size={50}
                    />
                    <div className="text-slate-900 bg-gradient-to-bl from-yellow-500 to-amber-400 via-amber-200 rounded-full p-2 absolute -top-[0.8rem] -left-[0.62rem]">
                      {getIcon(data.team.categoryId!)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TeamCard;