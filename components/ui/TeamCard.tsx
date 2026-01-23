"use client";
import { useCallback, useEffect, useState } from "react";
import { Fa1, Fa2, Fa3, Fa4, Fa5 } from "react-icons/fa6";
import {
  getCurrentTeamDurationInPosition,
} from "@/actions/PositionActions";
import {
  Sword,
  Crown,
  Flag,
  Shield,
  ArrowBigDownDash,
  ArrowBigUpDash,
  CircleMinus,
} from "lucide-react";

interface TeamCardProps {
  data: Position;
  activityAllowed: boolean;
  challengable?: boolean;
  isTop?: boolean;
  isPlayer?: boolean;
  defended?: boolean;
  onChallenge?: (team: TeamWithPlayers) => void;
}

const TeamCard = ({
  data,
  challengable = false,
  isTop = false,
  isPlayer = false,
  defended = false,
  activityAllowed = true,
  onChallenge,
}: TeamCardProps) => {
  const getIcon = (category: number) => {
    switch (category) {
      case 1:
        return <Fa1 size={12} />;
      case 2:
        return <Fa2 size={12} />;
      case 3:
        return <Fa3 size={12} />;
      case 4:
        return <Fa4 size={12} />;
      case 5:
        return <Fa5 size={12} />;
    }
  };

  const [topDate, setTopDate] = useState("");

  const handleChallenge = () => {
    // Ensure card is not defended before calling onChallenge
    if (data.team && onChallenge && !defended) {
      onChallenge(data.team);
    }
  };

  const getTopDate = useCallback(async () => {
    try {
      if (!isTop) return;
      if (!data.team) return;

      console.log(data.team.lastResult);

      const time = await getCurrentTeamDurationInPosition(data.team.id);
      if (!time) return;

      setTopDate(time.format);
    } catch (error) {
      console.error("Error al calcular la duración del top", error);
      setTopDate("... algún tiempo");
    }
  }, [data.team, isTop]);

  useEffect(() => {
    getTopDate();
  }, [getTopDate]);

  const statusColors: Record<TeamWithPlayers["status"], string> = {
    loser: "bg-red-500/10 border-red-500/40 hover:border-red-500/60",
    winner: "bg-green-500/10 border-green-500/40 hover:border-green-500/60",
    idle: "bg-slate-500/5 border-slate-400/30 hover:border-slate-400/50",
    risky: "bg-orange-500/10 border-orange-500/40 hover:border-orange-500/60",
  };

  const specialColors = {
    champion:
      "bg-gradient-to-br from-yellow-300/20 via-yellow-400/15 to-amber-500/25 border-yellow-400/70 hover:border-yellow-400/90 shadow-yellow-300/30 shadow-lg",
  };

  const statusAccents: Record<TeamWithPlayers["status"], string> = {
    loser: "bg-red-500",
    winner: "bg-green-500",
    idle: "bg-slate-400",
    risky: "bg-orange-500",
  };

  const specialAccents = {
    champion: "bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500",
  };

  const getStatusIcon = () => {
    if (defended) {
      return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white rounded-full p-1.5 shadow-lg z-10">
          <Shield size={14} strokeWidth={4} />
        </div>
      );
    }

    if (isPlayer) {
      return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-200 to-amber-400 text-black rounded-full p-1.5 shadow-lg z-10">
          <Flag size={12} />
        </div>
      );
    }

    if (challengable) {
      return (
        <div className="absolute -top-3 -right-3 bg-gradient-to-br from-amber-600 to-yellow-600 via-yellow-400 text-amber-900 rounded-full p-1 shadow-md z-10">
          <Sword size={18} strokeWidth={2} />
        </div>
      );
    }

    if (isTop) {
      return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-800 rounded-full p-1.5 shadow-lg z-10 animate-pulse">
          <Crown size={12} />
        </div>
      );
    }

    return null;
  };

  const getCardAnimation = () => {
    if (isTop) {
      return "hover:shadow-xl hover:shadow-yellow-400/30 hover:scale-[1.03]";
    }
    if (isPlayer) {
      return "hover:shadow-xl hover:shadow-blue-400/30 hover:scale-[1.03]";
    }
    // Card is only animated on hover if it's actually challengable
    return challengable && !defended
      ? "hover:shadow-lg hover:scale-[1.02]"
      : "";
  };

  const getLastResultDisplay = () => {
    if (!data.team?.lastResult || data.team.lastResult === "none") return null;

    const config = {
      down: {
        icon: ArrowBigDownDash,
        color: isTop
          ? "text-yellow-300"
          : isPlayer
          ? "text-red-300"
          : "text-red-400",
      },
      up: {
        icon: ArrowBigUpDash,
        color: isTop
          ? "text-yellow-300"
          : isPlayer
          ? "text-green-300"
          : "text-green-400",
      },
      stayed: {
        icon: CircleMinus,
        color: isTop
          ? "text-yellow-300"
          : isPlayer
          ? "text-slate-200"
          : "text-slate-300",
      },
    };

    const { icon: Icon, color } = config[data.team.lastResult];

    return (
      <>
        <div
          className={`w-[1px] h-3 ${
            isTop || isPlayer ? "bg-slate-400" : "bg-slate-600"
          }`}
        />
        <div className="flex items-center">
          <span className={`font-medium ${color}`}>
            <Icon size={18} strokeWidth={3} />
          </span>
        </div>
      </>
    );
  };

  const isActuallyChallengable = challengable && !defended;

  return (
    <>
      {data.team && (
        <div
          onClick={isActuallyChallengable ? handleChallenge : undefined}
          className={`relative group ${
            isTop ? specialColors.champion : statusColors[data.team.status!]
          } border-2 rounded-lg transition-all duration-300 p-3 ${
            isTop
              ? "min-w-[180px] max-w-[200px]"
              : "min-w-[150px] max-w-[150px]"
          } backdrop-blur-sm snap-center ${getCardAnimation()} ${
            isActuallyChallengable ? "cursor-pointer border-dashed" : ""
          }
          ${data.team.losingStreak! >= 2 ? "animate-losing-glow" : ""}
          `}
        >
          {/* Status indicator */}
          <div
            className={`absolute top-0 left-0 w-full h-1 ${
              isTop ? specialAccents.champion : statusAccents[data.team.status!]
            } rounded-t-md`}
          />

          {/* Champion glow effect */}
          {isTop && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-amber-400/10 rounded-lg pointer-events-none" />
          )}

          {/* Player glow effect */}
          {isPlayer && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-cyan-400/10 rounded-lg pointer-events-none" />
          )}

          {/* Status icon */}
          {getStatusIcon()}

          {/* Header with category and name */}
          <div
            className={`flex items-center mb-2 justify-between ${
              isTop
                ? "min-h-[1.8rem] max-h-[1.8rem]"
                : "min-h-[2.5rem] max-h-[2.5rem]"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div
                className={`font-semibold text-sm text-wrap ${
                  isTop ? "text-yellow-200" : "text-white"
                }`}
                title="Nombre del equipo"
              >
                {data.team.displayName}
              </div>
            </div>

            {/* Category badge */}
            <div className="flex-shrink-0 ml-2">
              <div
                className={`${
                  data.team.categoryId === 1
                    ? "bg-gradient-to-bl from-yellow-300 via-amber-200 to-yellow-400 text-slate-900"
                    : data.team.categoryId === 2
                    ? "bg-gradient-to-bl from-gray-300 via-slate-200 to-gray-400 text-slate-900"
                    : data.team.categoryId === 3
                    ? "bg-gradient-to-bl from-amber-700 via-orange-500 to-amber-800 text-white"
                    : "bg-gradient-to-bl from-amber-400 via-amber-300 to-amber-500 text-slate-800"
                } rounded-full w-6 h-6 flex items-center justify-center font-bold`}
              >
                {getIcon(data.team.categoryId!)}
              </div>
            </div>
          </div>

          {/* Win/Loss stats */}
          <div
            className={`flex justify-evenly gap-3 items-center w-full text-xs ${
              data.team.losingStreak! >= 2 ? "animate-pulse" : ""
            }`}
          >
            <div className="flex self-center items-center">
              <span
                className={`font-medium ${
                  isTop
                    ? "text-green-300"
                    : isPlayer
                    ? "text-green-300"
                    : "text-green-400"
                }`}
              >
                W
              </span>
              <span
                className={`ml-1 ${
                  isTop || isPlayer ? "text-slate-100" : "text-white"
                }`}
              >
                {data.team.wins}
              </span>
            </div>
            <div
              className={`w-[1px] h-3 ${
                isTop || isPlayer ? "bg-slate-400" : "bg-slate-600"
              }`}
            />
            <div className="flex items-center">
              <span
                className={`font-medium ${
                  isTop
                    ? "text-red-300"
                    : isPlayer
                    ? "text-red-300"
                    : "text-red-400"
                }`}
              >
                L
              </span>
              <span
                className={`ml-1 ${
                  isTop || isPlayer ? "text-slate-100" : "text-white"
                }`}
              >
                {data.team.losses}
              </span>
            </div>

            {data.team.lastResult !== "none" &&
              data.team.lastResult &&
              getLastResultDisplay()}
          </div>
          {/* If is top Team display duration */}
          {isTop && (
            <div className="w-full mt-2 text-center text-yellow-300 text-sm font-medium">
              <p>Escaló hace {topDate || "..."}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TeamCard;
