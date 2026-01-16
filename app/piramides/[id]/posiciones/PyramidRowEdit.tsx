import TeamCardWithDelete from "@/components/ui/TeamCardWithDelete";
import EmptySlot from "@/components/ui/EmptySlotEdit";
import { useCenteredScroll } from "@/hooks/useCenteredScroll";

interface Position {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
}

const PyramidRow = ({
  handleSetTeam,
  pyramidId,
  positions,
  isFirst = false,
  isLast = false,
}: {
  handleSetTeam: (pos: Position) => void;
  pyramidId: number;
  positions: Position[];
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();

  // Dynamic class names based on position
  const borderClasses = `
    border-l-2 border-r-2 border-slate-500 border-dashed
    ${isFirst ? "border-t-2 rounded-t-2xl" : ""}
    ${isLast ? "border-b-2 rounded-b-2xl" : ""}
    ${!isFirst && !isLast ? "border-t-2" : ""}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth max-w-screen z-10"
      >
        <div
          className={`flex gap-4 p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar rounded-t-2xl border-t-2 bg-indor-black/90 items-center snap-x ${borderClasses}`}
        >
          {positions.map((pos) =>
            pos.team ? (
              <TeamCardWithDelete
                key={pos.id}
                data={pos}
                pyramidId={pyramidId}
              />
            ) : (
              <div key={pos.id} onClick={() => handleSetTeam(pos)}>
                <EmptySlot
                  rowNumber={pos.row}
                  posNumber={pos.col}
                />
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default PyramidRow;