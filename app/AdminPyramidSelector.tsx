"use client";
import PyramidDisplay from "@/components/pyramidPlayer/PyramidDisplay";
import { usePyramidStore } from "@/stores/usePyramidsStore";
import { useEffect, useState } from "react";
import { getPyramidData } from "@/actions/IndexActions";
import { Pyramid } from "lucide-react";

const AdminPyramidSelector = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    pyramids,
    selectedPyramidId,
    setSelectedPyramidId,
    pyramidData,
    setPyramidData,
  } = usePyramidStore();

  useEffect(() => {
    console.log(pyramids, selectedPyramidId, pyramidData);
  }, [pyramidData, pyramids, selectedPyramidId]);

  useEffect(() => {
    const fetchPyramidData = async (id: number) => {
      const pyramidData = await getPyramidData(id);
      console.log(pyramidData)
      setPyramidData(pyramidData);
    };
    if (selectedPyramidId) {
      fetchPyramidData(selectedPyramidId);
    }
  }, [selectedPyramidId, setPyramidData]);

  const handlePyramidChange = (pyramidId: number) => {
    setSelectedPyramidId(pyramidId);
  };

  return (
    <div className="flex flex-col justify-start md:mt-10 items-center h-screen">
      <div className="max-w-md md:w-full flex md:flex-row-reverse absolute top-5 left-5 md:right-5 md:left-auto">
        <div className="relative z-20">
          {/* Circular Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-14 h-14 bg-indor-black/70 ring-2 ring-indor-brown-light hover:bg-indor-black rounded-full shadow-lg flex items-center justify-center transition-all duration-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indor-brown-light"
          >
            <Pyramid color="white" />
          </button>

          {/* Dropdown List */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown Content */}
              <div className="absolute top-16 left-0 md:right-0 md:left-auto bg-indor-black/80 rounded-lg shadow-xl border border-black min-w-80 max-w-sm animate-in fade-in duration-100">
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-3 border-b border-black text-white">
                    Selecciona una pirámide
                  </h2>

                  <div className="max-h-64 overflow-y-auto no-scrollbar">
                    <div className="space-y-1">
                      {pyramids.map((pyramid) => (
                        <button
                          key={pyramid.id}
                          onClick={() => {
                            handlePyramidChange(pyramid.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-md transition-colors duration-150 hover:bg-indor-brown-light/80 focus:outline-none focus:bg-indor-brown-light focus:ring-2 focus:ring-indor-brown-light ${
                            selectedPyramidId === pyramid.id
                              ? "bg-indor-brown-light/30 border-l-4 border-indor-orange"
                              : "border-l-4 border-transparent"
                          }`}
                        >
                          <div className="font-medium text-sm text-white">
                            {pyramid.name}
                          </div>
                          {pyramid.description && (
                            <div className="text-sm text-white mt-1">
                              {pyramid.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected pyramid info */}
                  {selectedPyramidId && (
                    <div className="mt-4 pt-3 border-t border-black">
                      <div className="text-sm text-white">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">
                            Seleccionado:{" "}
                            {
                              pyramids.find((p) => p.id === selectedPyramidId)
                                ?.name
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pyramid Display */}
      {pyramidData && <PyramidDisplay data={pyramidData} />}

      {!pyramidData && selectedPyramidId && (
        <div className="text-center py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="font-medium">Pirámide no encontrada</p>
            <p className="text-sm">
              La pirámide seleccionada no pudo procesarse.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPyramidSelector;
