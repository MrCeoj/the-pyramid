"use client";

type Team = {
  id: number;
  name: string;
  wins: number;
  status: string;
  losses: number;
};

type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

const TeamCard: React.FC<{ data: Position; challenged: boolean }> = ({
  data,
  challenged = false,
}) => {
  const statusColors: Record<Team["status"], string> = {
    looser: "bg-red-900/60 border-red-900/90 hover:bg-red-800/70",
    winner: "bg-green-900/60 border-green-900/90 hover:bg-green-800/70",
    idle: "bg-slate-900/50 border-slate-900/90 hover:bg-slate-800/60",
    risky: "bg-yellow-700/60 border-yellow-900 hover:bg-yellow-600/70",
  };
  return (
    <>
      {data.team && (
        <div
          onClick={() => data.team}
          className={`
        ${statusColors[data.team.status]} 
        border-dashed border-4 rounded-xl 
        hover:shadow-2xl transition-all duration-200 cursor-pointer 
        hover:scale-[1.02] p-4 min-w-[150px] max-w-[170px] 
        backdrop-blur-sm snap-center
      `}
        >
          <div className="text-center">
            <div
              className="font-bold text-base text-white truncate mb-3"
              title={data.team?.name}
            >
              {data.team?.name ?? "Unknown"}
            </div>
            {data.team && (
              <div className="flex flex-col">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400 font-medium">
                    W: {data.team.wins}
                  </span>
                  <span className="text-red-400 font-medium">
                    L: {data.team.losses}
                  </span>
                </div>
                {challenged && <button>Retar</button>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TeamCard;
