import { db } from "@/lib/drizzle"; // Your Drizzle instance
import { sql } from "drizzle-orm";
import { getTeamDisplayName } from "@/lib/utils"; // Import your helper function

type TopTeamResult = {
  team_id: number;
  total_duration: string;
  player1_id: string | null;
  player1_paternal_surname: string | null;
  player1_maternal_surname: string | null;
  player1_nickname: string | null;
  player2_id: string | null;
  player2_paternal_surname: string | null;
  player2_maternal_surname: string | null;
  player2_nickname: string | null;
};

type ParsedDuration = {
  totalDays: number;
  totalHours: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  raw: string;
  format: string;
};

function parsePostgreSQLInterval(intervalString: string): ParsedDuration {
  if (!intervalString || intervalString.trim() === "") {
    return {
      totalDays: 0,
      totalHours: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      raw: intervalString,
      format: "0 minutos",
    };
  }

  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  // Handle different PostgreSQL interval formats
  const trimmed = intervalString.trim();

  // Check if it contains days
  const dayMatch = trimmed.match(/(\d+)\s+days?/i);
  if (dayMatch) {
    days = parseInt(dayMatch[1], 10);
  }

  // Extract time part (HH:MM:SS or HH:MM or just HH)
  const timeMatch = trimmed.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    seconds = parseInt(timeMatch[3], 10);
  } else {
    const shortTimeMatch = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (shortTimeMatch) {
      hours = parseInt(shortTimeMatch[1], 10);
      minutes = parseInt(shortTimeMatch[2], 10);
    }
  }

  const totalHours = days * 24 + hours;
  const totalDays = Math.floor(totalHours / 24);

  const format = formatDuration(days, hours, minutes);

  return {
    totalDays,
    totalHours,
    days,
    hours,
    minutes,
    seconds,
    raw: intervalString,
    format,
  };
}

function formatDuration(days: number, hours: number, minutes: number): string {
  const parts: string[] = [];

  if (days > 0) {
    parts.push(days === 1 ? "1 día" : `${days} días`);
  }

  if (hours > 0) {
    parts.push(hours === 1 ? "1 hora" : `${hours} horas`);
  }

  if (parts.length === 0 && minutes > 0) {
    parts.push(minutes === 1 ? "1 minuto" : `${minutes} minutos`);
  }

  if (parts.length === 0) {
    return "menos de 1 minuto";
  }

  // Join with "y"
  if (parts.length === 1) {
    return parts[0];
  } else if (parts.length === 2) {
    return `${parts[0]} y ${parts[1]}`;
  } else {
    // ultra edge case
    return parts.slice(0, -1).join(", ") + ` y ${parts[parts.length - 1]}`;
  }
}

export async function getLongestReigningTeam(pyramidId: number) {
  const query = sql`
    WITH AllTopSpotEvents AS (
      -- Step 1: Identify all events where a team either ENTERED or LEFT the top spot.
      -- This is the key change to handle removals.
      
      -- Event type: A team MOVES INTO the top spot
      SELECT
        "team_id",
        "effective_date",
        'reign_start' AS event_type
      FROM "position_history"
      WHERE "pyramid_id" = ${pyramidId} AND "new_row" = 1 AND "new_col" = 1

      UNION ALL

      -- Event type: A team MOVES OUT of the top spot
      SELECT
        "team_id",
        "effective_date",
        'reign_end' AS event_type
      FROM "position_history"
      WHERE "pyramid_id" = ${pyramidId} AND "old_row" = 1 AND "old_col" = 1
    ),
    RankedEvents AS (
      -- Step 2: Order all top-spot events chronologically to establish a timeline.
      SELECT
        team_id,
        effective_date,
        event_type,
        -- The next event's date, regardless of type, marks the end of the current state.
        LEAD(effective_date, 1) OVER (ORDER BY effective_date) AS next_event_date
      FROM AllTopSpotEvents
    ),
    ReignDurations AS (
      -- Step 3: Filter for 'reign_start' events and calculate their duration using the next event's date.
      SELECT
        team_id,
        effective_date AS reign_start,
        COALESCE(
          next_event_date,
          NOW() -- If no subsequent event exists, the reign continues to the present.
        ) AS reign_end
      FROM RankedEvents
      WHERE event_type = 'reign_start'
    ),
    TotalTimeAtTop AS (
      -- Step 4: Sum up all reign durations for each team,
      -- as a team could have multiple non-consecutive reigns. (This logic is unchanged).
      SELECT
        team_id,
        SUM(reign_end - reign_start) AS total_duration
      FROM ReignDurations
      GROUP BY team_id
    )
    -- Final Step: Select the team with the longest total duration
    -- and join to get player details. (This logic is unchanged).
    SELECT
      t.id AS team_id,
      tt.total_duration,
      p1.id AS player1_id,
      p1.paternal_surname AS player1_paternal_surname,
      p1.maternal_surname AS player1_maternal_surname,
      prof1.nickname AS player1_nickname,
      p2.id AS player2_id,
      p2.paternal_surname AS player2_paternal_surname,
      p2.maternal_surname AS player2_maternal_surname,
      prof2.nickname AS player2_nickname
    FROM TotalTimeAtTop tt
    JOIN team t ON tt.team_id = t.id
    LEFT JOIN users p1 ON t.player1_id = p1.id
    LEFT JOIN profile prof1 ON p1.id = prof1.user_id
    LEFT JOIN users p2 ON t.player2_id = p2.id
    LEFT JOIN profile prof2 ON p2.id = prof2.user_id
    ORDER BY tt.total_duration DESC
    LIMIT 1;
  `;

  const result = await db.execute<TopTeamResult>(query);

  if (result.length === 0) {
    return null;
  }

  const topTeamData = result[0];

  const displayName = getTeamDisplayName(
    topTeamData.player1_id
      ? {
          id: topTeamData.player1_id,
          paternalSurname: topTeamData.player1_paternal_surname!,
          maternalSurname: topTeamData.player1_maternal_surname!,
          nickname: topTeamData.player1_nickname,
        }
      : null,
    topTeamData.player2_id
      ? {
          id: topTeamData.player2_id,
          paternalSurname: topTeamData.player2_paternal_surname!,
          maternalSurname: topTeamData.player2_maternal_surname!,
          nickname: topTeamData.player2_nickname,
        }
      : null
  );
  const parsedDuration = parsePostgreSQLInterval(topTeamData.total_duration);

  return {
    teamId: topTeamData.team_id,
    displayName: displayName,
    totalDuration: parsedDuration,
  };
}