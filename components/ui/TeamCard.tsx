type Team = {
  id: number;
  name: string;
  wins: number;
  losses: number;
};

type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

const TeamCard: React.FC<{ data: Position; onClick: (team: Team) => void }> = ({
  data,
  onClick,
}) => {

  return (
    <div
      onClick={() => data.team && onClick(data.team)}
      className="bg-slate-900/50 bg-opacity-50 border-dashed border-4 rounded-xl hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02] p-4 min-w-[150px] max-w-[170px] backdrop-blur-sm snap-center"
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
            <button>Retar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;