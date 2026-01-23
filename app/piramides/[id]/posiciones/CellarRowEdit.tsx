import TeamCardWithDelete from "@/components/ui/TeamCardWithDelete";
import EmptySlot from "@/components/ui/EmptySlotEdit";
import { useCenteredScroll } from "@/hooks/useCenteredScroll";

const CellarRow = ({
  handleSetTeam,
  pyramidId,
  position,
  isFirst = false,
  isLast = false,
}: {
  handleSetTeam: (pos: Position) => void;
  pyramidId: number;
  position: Position;
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();

  // Wooden cellar border styling with aged wood texture effect
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
        className="h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth max-w-screen z-10 text-center"
      >
        <div
          className={`p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar rounded-t-xl items-center snap-x ${borderClasses}`}
          style={{
            background: `
              /* Base wood color gradient */
              linear-gradient(180deg, 
                rgba(102, 72, 45, 0.96) 0%, 
                rgba(81, 55, 34, 0.96) 50%, 
                rgba(62, 43, 28, 0.96) 100%
              ),
              /* Simulated wood grain pattern */
              repeating-linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.05) 0px,
                rgba(0, 0, 0, 0.05) 3px,
                transparent 3px,
                transparent 10px
              ),
              repeating-linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.03) 0px,
                rgba(255, 255, 255, 0.03) 2px,
                transparent 2px,
                transparent 6px
              )
            `,
            backgroundBlendMode: "overlay, multiply, normal",
            boxShadow: `
              inset 0 2px 8px rgba(0, 0, 0, 0.6),
              inset 0 -2px 6px rgba(0, 0, 0, 0.4)
            `,
          }}
        >
          <h1 className="mb-2 text-amber-200/90 font-jolly text-2xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
            EL SÓTANO
          </h1>
          {position.team ? (
            <TeamCardWithDelete data={position} pyramidId={pyramidId} />
          ) : (
            <div onClick={() => handleSetTeam(position)}>
              <EmptySlot rowNumber={position.row} posNumber={position.col} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CellarRow;
