import { useEffect, useState, useRef } from "react"
import { X } from "lucide-react"

type Player = {
  id: string;
  name: string | null;
  paternalSurname: string | null;
  nickname: string | null;
  email: string | null;
};

// A new reusable search bar component for selecting players
const PlayerSearchBar = ({
  label,
  players,
  selectedPlayerId,
  onSelectPlayer,
  disabledPlayerIds = [],
}: {
  label: string;
  players: Player[];
  selectedPlayerId: string;
  onSelectPlayer: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabledPlayerIds?: any[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter players based on search term, excluding disabled players
  const filteredPlayers = searchTerm
    ? players.filter(
        (player) =>
          !disabledPlayerIds.includes(player.id) &&
          (`${player.name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleSelect = (playerId: string) => {
    onSelectPlayer(playerId);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onSelectPlayer(""); // Clear selection by passing an empty string
  };

  return (
    <div ref={searchContainerRef} className="relative">
      <label className="block text-sm font-medium text-white mb-1">
        {label}
      </label>
      {selectedPlayer ? (
        <div className="flex items-center justify-between w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700">
          <span className="text-white">
            {selectedPlayer.nickname || `${selectedPlayer.name}`}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Buscar por nombre, apodo o correo..."
            className="w-full px-3 py-2 text-white bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indor-orange"
          />
          {isDropdownOpen && searchTerm && (
            <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <li
                    key={player.id}
                    onClick={() => handleSelect(player.id)}
                    className="px-4 py-2 text-white cursor-pointer hover:bg-gray-700"
                  >
                    {player.nickname || `${player.name}`}{" "}
                    <span className="text-sm text-gray-400">
                      ({player.email})
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-400">
                  No se hayaron jugadores
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerSearchBar;