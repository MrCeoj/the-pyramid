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
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ positions, isFirst = false, isLast = false }) => {
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();
  const { session } = useSessionStore();
  
  const isChallengable = (pos: Position) => {
    if (session?.user.role === "admin") return false
    return false
  }

  // Dynamic class names based on position
  const borderClasses = `
    border-l-2 border-r-2 border-slate-500 border-dashed
    ${isFirst ? 'border-t-2 rounded-t-2xl' : ''}
    ${isLast ? 'border-b-2 rounded-b-2xl' : ''}
    ${!isFirst && !isLast ? 'border-t-2' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div
      ref={scrollContainerRef}
      className="h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth max-w-screen  z-10"
    >
      <div className={`flex gap-4 p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar rounded-t-2xl border-t-2 bg-indor-black/90 items-center snap-x ${borderClasses}`}>
        {positions.map((pos) =>(
          pos.team ? (
            <TeamCard key={pos.id} data={pos} challengable={isChallengable(pos)}/>
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