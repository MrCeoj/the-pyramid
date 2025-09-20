import TeamCard from "@/components/ui/TeamCard";
import EmptySlot from "@/components/ui/EmptySlot";
import { useCenteredScroll } from "@/hooks/useCenteredScroll"; // Adjust the import path
import { useSessionStore } from "@/stores/sessionStore";

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

const PyramidRow: React.FC<{
  positions: Position[];
  onTeamClick: (team: Team) => void;
}> = ({ positions }) => {
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();
  const { session } = useSessionStore();
  
  const isChallenged = (pos: Position) => {
    if (session?.user.role === "admin") return false
    return false
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth max-w-screen z-10"
    >
      <div className="flex gap-4 p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar bg-indor-black/90 rounded-t-2xl border-l-2 border-t-2 border-r-2 border-slate-500  border-dashed items-center snap-x">
        {positions.map((pos) =>(
          pos.team ? (
            <TeamCard key={pos.id} data={pos} challenged={isChallenged(pos)}/>
          ) : (
            <EmptySlot key={pos.id} rowNumber={pos.row} posNumber={pos.col} />
          )
        )
        )}
      </div>
    </div>
  );
};

export default PyramidRow;
