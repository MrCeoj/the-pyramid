import TeamCard from "../ui/TeamCard";
import EmptySlot from "../ui/EmptySlot";
import { useCenteredScroll } from "@/hooks/useCenteredScroll"; // Adjust the import path

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

const PyramidRow: React.FC<{
  positions: Position[];
  onTeamClick: (team: Team) => void;
}> = ({ positions, onTeamClick }) => {
  // Use the custom hook to get a ref
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();

  return (
    <div
      // Attach the ref to the scrollable container
      ref={scrollContainerRef}
      className="w-full h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth"
    >
      <div className="flex gap-4 justify-center items-center w-max mx-auto snap-x">
        {positions.map((pos) =>
          pos.team ? (
            <TeamCard key={pos.id} data={pos} onClick={onTeamClick} />
          ) : (
            <EmptySlot key={pos.id} rowNumber={pos.row} posNumber={pos.col} />
          )
        )}
      </div>
    </div>
  );
};

export default PyramidRow;