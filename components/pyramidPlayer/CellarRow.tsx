import EmptySlot from "@/components/ui/EmptySlot";
import TeamCard from "@/components/ui/TeamCard";
import { useCenteredScroll } from "@/hooks/useCenteredScroll";
import { TeamWithPlayers } from "@/actions/PositionActions";

type PyramidPosition = {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
};

const CellarRow = ({
  userTeamId,
  position,
  isFirst = false,
  isLast = false,
  active = true,
}: {
  position: PyramidPosition;
  userTeamId?: number | null;
  active?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();
  const borderClasses = `
    border-l-4 border-r-4 border-amber-900/80
    ${isFirst ? "border-t-4 rounded-t-xl" : ""}
    ${isLast ? "border-b-4 rounded-b-xl" : ""}
    ${!isFirst && !isLast ? "border-t-4" : ""}
    shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="relative h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth max-w-screen z-10"
      >
        <div
          className={`p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar rounded-t-xl items-center snap-x border-4 border-yellow-900 shadow-xl ${borderClasses}`}
          style={{
            background: `
        /* Rich wood base gradient */
        linear-gradient(180deg, 
          rgba(89, 56, 33, 0.95) 0%, 
          rgba(65, 42, 23, 0.98) 50%, 
          rgba(45, 28, 15, 0.95) 100%
        ),
        /* Subtle wood grain */
        repeating-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.03) 0px,
          rgba(255, 255, 255, 0.03) 3px,
          transparent 3px,
          transparent 10px
        )
      `,
            backgroundBlendMode: "overlay, multiply, normal",
            boxShadow: `
        inset 0 3px 8px rgba(0, 0, 0, 0.6),
        inset 0 -3px 6px rgba(0, 0, 0, 0.4),
        0 6px 14px rgba(0, 0, 0, 0.5)
      `,
            borderRadius: "0.75rem 0.75rem 0 0",
            position: "relative",
          }}
        >
          {/* Title */}
          <h1
            className="mb-2 font-jolly text-center text-2xl tracking-widest 
             text-transparent bg-clip-text 
             bg-gradient-to-b from-amber-200 to-orange-400
             drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]"
          >
            EL SÓTANO
          </h1>

          <div className="absolute top-0 left-0 right-0 w-full h-2 bg-gradient-to-b from-gray-500 to-gray-700 border-b border-gray-900 shadow-inner" />

          {/* Content */}
          {position.team ? (
            <TeamCard
              key={position.id}
              data={position}
              challengable={false}
              isPlayer={position.team.id === userTeamId}
              defended={position.team.defendable!}
              isTop={position.row === 1}
              onChallenge={() => {}}
              activityAllowed={active}
            />
          ) : (
            <EmptySlot rowNumber={position.row} posNumber={position.col} />
          )}
        </div>
      </div>
    </>
  );
};

export default CellarRow;
