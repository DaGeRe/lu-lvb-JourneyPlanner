import { ChevronLeft, ChevronRight, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import PersonStanding from "../../../public/icons/otp-icons/Walk.svg";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSettingsContext } from "@/contexts/settingsContext";
import { useOtpDataContext } from "@/contexts/DataContext/routingDataContext";
import { TransportMode } from "@/types/TransportMode";
import TramLogo from "../../../public/icons/otp-icons/Tram-Logo.svg";
import S_BahnLogo from "../../../public/icons/otp-icons/S-Bahn-Logo.svg";
import BusLogo from "../../../public/icons/otp-icons/Bus-Logo.svg";
import TrainLogo from "../../../public/icons/otp-icons/Train.svg";
import { useUIContext } from "@/contexts/uiContext";
import { useMapContext } from "@/contexts/mapContext";
import { Itinerary } from "@/types/Itinerary";

type LegType = 'START' | 'END' | 'WALK' | 'TRANSFER' | TransportMode;

const isWalkMode = (mode: string): boolean => mode === "WALK";

const isWaitLeg = (leg: any): boolean => {
  return leg.mode === "WAIT" || (leg.from.name === leg.to.name && leg.mode !== "WALK");
};

const getLegType = (mode: string): LegType => {
  if (mode === 'WALK') return 'WALK';
  if (mode === 'TRANSFER') return 'TRANSFER';
  return mode as TransportMode;
};

const formatTime = (timestamp: number): string => {
  // Convert the timestamp to a Date object
  const date = new Date(timestamp);

  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Format as HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
};

const getTransportLogo = (mode: TransportMode) => {
  switch (mode) {
    case "TRAM": return TramLogo;
    case "SUBURB": return S_BahnLogo;
    case "BUS": return BusLogo;
    case "TRAIN": return TrainLogo;
    default: return null;
  }
};

// Function to calculate and format time difference for delays/early arrivals
const formatTimeDifference = (scheduledTime: number, actualTime: number): { text: string, color: string } => {
  if (!scheduledTime || !actualTime) return { text: "", color: "" };

  const diffInSeconds = (actualTime - scheduledTime) / 1000;
  const diffInMinutes = Math.round(diffInSeconds / 60);

  if (diffInMinutes === 0) return { text: "", color: "" };

  if (diffInMinutes > 0) {
    return {
      text: `+${diffInMinutes}m`,
      color: "text-red-600"
    };
  } else {
    return {
      text: `${diffInMinutes}m`,
      color: "text-green-600"
    };
  }
};

const SelectedRouteDetails = () => {
  const { otpData, selectedItineraryIndex, setSelectedItineraryIndex, clearSearchParams } = useOtpDataContext();
  const { goToPreviousViewMode, setViewMode, previousViewMode, navigationHistory } = useUIContext();
  const { setSelectedItinerary, selectedItinerary } = useMapContext();
  const [expandedLegs, setExpandedLegs] = useState<number[]>([]);

  // Update the map when the selected itinerary changes
  useEffect(() => {
    if (otpData && selectedItineraryIndex !== null) {
      const itinerary = otpData.plan.itineraries[selectedItineraryIndex];
      const mapItinerary = new Itinerary(
        otpData.plan.from,
        otpData.plan.to,
        itinerary
      );
      setSelectedItinerary(mapItinerary);
    }

    // Cleanup function
    return () => {
      setSelectedItinerary(null);
    };
  }, [otpData?.plan?.itineraries, selectedItineraryIndex]); 

  useEffect(() => {
    console.log('SelectedRouteDetails navigation state:', {
      previousViewMode,
      navigationHistory
    });
  }, [previousViewMode, navigationHistory]);

  if (!otpData || selectedItineraryIndex === null) {
    return <div>No route selected</div>;
  }

  const totalRoutes = Math.min(otpData.plan.itineraries.length, 5);

  const getLocationName = (leg: any, isDestination: boolean) => {
    try {
      if (!leg) return "Unknown location";

      const location = isDestination ? leg.to.name : leg.from.name;

      // Handle different possible formats
      if (!location) return "Unknown location";
      if (typeof location === 'string') return location;
      if (typeof location.name === 'string') return location.name;
      if (typeof location === 'object' && 'name' in location) {
        return String(location.name);
      }

      return "Unknown location";
    } catch (error) {
      console.error('Error getting location name:', error);
      return "Unknown location";
    }
  };

  const handlePrevRoute = () => {
    if (selectedItineraryIndex > 0) {
      setSelectedItineraryIndex(selectedItineraryIndex - 1);
    }
  };

  const handleNextRoute = () => {
    if (selectedItineraryIndex < totalRoutes - 1) {
      setSelectedItineraryIndex(selectedItineraryIndex + 1);
    }
  };

  const toggleLegExpansion = (index: number) => {
    setExpandedLegs(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Handle reset button click
  const handleResetClick = () => {
    clearSearchParams();
    setSelectedItinerary(null);
    setViewMode("DEFAULT");
  };

  if (!selectedItinerary)
    return <div>No itinerary selected</div>;

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-yellow text-primary-blue">
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-primary-yellow/80 rounded-full transition-colors"
            onClick={goToPreviousViewMode}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="text-sm opacity-80">
              {formatTime(selectedItinerary.otpItinerary.startTime)} - {formatTime(selectedItinerary.otpItinerary.endTime)}
            </div>
            <div className="font-medium">{formatDuration(selectedItinerary.otpItinerary.duration)}</div>
          </div>
        </div>
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevRoute}
            disabled={selectedItineraryIndex === 0}
            className={`p-1 rounded ${selectedItineraryIndex === 0 ? 'text-primary-blue/40' : 'hover:bg-primary-yellow/80'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-sm">
            {selectedItineraryIndex + 1} / {totalRoutes}
          </span>
          <button
            onClick={handleNextRoute}
            disabled={selectedItineraryIndex === totalRoutes - 1}
            className={`p-1 rounded ${selectedItineraryIndex === totalRoutes - 1 ? 'text-primary-blue/40' : 'hover:bg-primary-yellow/80'}`}
          >
            <ChevronRight size={24} />
          </button>
          <button
            className="p-2 hover:bg-primary-yellow/80 rounded-full transition-colors ml-2"
            onClick={handleResetClick}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="p-4">
        <div className="space-y-6">
          {selectedItinerary.otpItinerary.legs.map((leg, index) => (
            <div key={index} className="flex gap-4">
              {/* Time Column */}
              <div className="w-16 flex flex-col items-center">
                {!isWaitLeg(leg) && (
                  <>
                    {/* Departure Time */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <span className="font-medium text-gray-900">
                          {formatTime(leg.startTime)}
                        </span>
                        {(() => {
                          const actualDepartureTime = leg.startTime;
                          const scheduledDepartureTime = actualDepartureTime - (leg.departureDelay || 0) * 1000;
                          const timeDiff = formatTimeDifference(scheduledDepartureTime, actualDepartureTime);

                          return timeDiff.text && (
                            <span className={`absolute -top-3 -right-6 text-sm font-bold ${timeDiff.color}`}>
                              {timeDiff.text}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Timeline */}
                    {index < selectedItinerary.otpItinerary.legs.length && (
                      <div
                        className="h-full border-l-4 my-2 transition-all"
                        style={{ borderLeftColor: leg.routeColor && leg.routeColor.startsWith("#") ? leg.routeColor : undefined }}
                      />
                    )}

                    {/* Arrival Time */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <span className="font-medium text-gray-900">
                          {formatTime(leg.endTime)}
                        </span>
                        {(() => {
                          const actualArrivalTime = leg.endTime;
                          const scheduledArrivalTime = actualArrivalTime - (leg.arrivalDelay || 0) * 1000;
                          const timeDiff = formatTimeDifference(scheduledArrivalTime, actualArrivalTime);

                          return timeDiff.text && (
                            <span className={`absolute -top-3 -right-6 text-sm font-bold ${timeDiff.color}`}>
                              {timeDiff.text}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Content Column */}
              <div className="flex-1">
                {/* From Location */}
                {!isWaitLeg(leg) && (
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className={`w-3 h-3 rounded-full ${getLegType(leg.mode) === 'START' ? 'bg-green-500' : getLegType(leg.mode) === 'WALK' ? 'bg-gray-400' : ''}`}
                      style={{ backgroundColor: leg.routeColor && leg.routeColor.startsWith("#") ? leg.routeColor : undefined }}
                    />
                    <div className="font-medium text-gray-900">
                      {leg.from.name}
                    </div>
                  </div>
                )}

                {/* Transport Details */}
                <div className={`${isWaitLeg(leg) ? '' : 'ml-5'} mb-3`}>
                  {isWaitLeg(leg) ? (
                    <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2.5 rounded-lg shadow-sm">
                      <Clock size={24} className="text-gray-600" />
                      <span className="text-gray-600 text-lg">Wait ({formatDuration(leg.duration)})</span>
                    </div>
                  ) : !isWalkMode(leg.mode) ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getTransportLogo(leg.mode as TransportMode) && (
                            <Image src={getTransportLogo(leg.mode as TransportMode)!} alt={leg.mode} width={24} height={24} />
                          )}
                          <div
                            className="px-3 py-1.5 rounded-full shadow-sm"
                            style={{ backgroundColor: leg.routeColor && leg.routeColor.startsWith("#") ? leg.routeColor : undefined }}
                          >
                            <span className="text-white font-medium">
                              {leg.route ? `${leg.mode === 'SUBURB' ? 'S-BAHN' : leg.mode} ${leg.route}` : leg.mode === 'SUBURB' ? 'S-BAHN' : leg.mode}
                            </span>
                          </div>
                        </div>
                        
                        {leg.intermediateStops && leg.intermediateStops.length > 0 && (
                          <button
                            onClick={() => toggleLegExpansion(index)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedLegs.includes(index) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            <span className="text-sm text-gray-600 ml-1">
                              {leg.intermediateStops.length} stops
                            </span>
                          </button>
                        )}
                      </div>

                      {expandedLegs.includes(index) && leg.intermediateStops && leg.intermediateStops.length > 0 && (
                        <div className="ml-8 pl-4 border-l-2 border-gray-200">
                          {leg.intermediateStops.map((stop, stopIndex) => {
                            const legDuration = leg.endTime - leg.startTime;
                            const stopRatio = (stopIndex + 1) / (leg.intermediateStops?.length || 1);
                            const estimatedTime = leg.startTime + (legDuration * stopRatio);
                            const startDelayMs = (leg.departureDelay || 0) * 1000;
                            const endDelayMs = (leg.arrivalDelay || 0) * 1000;
                            const estimatedDelayMs = startDelayMs + (endDelayMs - startDelayMs) * stopRatio;
                            const scheduledTime = estimatedTime - estimatedDelayMs;
                            const timeDiff = formatTimeDifference(scheduledTime, estimatedTime);

                            return (
                              <div key={stopIndex} className="py-2 flex justify-between items-center border-b border-gray-100">
                                <div className="text-base text-gray-800">
                                  {stop.name}
                                </div>
                                <div className="flex items-center">
                                  <div className="relative">
                                    <span className="text-base font-normal">
                                      {formatTime(estimatedTime)}
                                    </span>
                                    {timeDiff.text && (
                                      <span className={`absolute -top-3 -right-6 text-sm font-bold ${timeDiff.color}`}>
                                        {timeDiff.text}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Image src={PersonStanding} alt="Walking" width={20} height={20} />
                      <span>Walk ({formatDuration(leg.duration)})</span>
                    </div>
                  )}
                </div>

                {/* To Location */}
                {!isWaitLeg(leg) && (
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getLegType(leg.mode) === 'END' ? 'bg-red-500' : getLegType(leg.mode) === 'WALK' ? 'bg-gray-400' : ''}`}
                      style={{ backgroundColor: leg.routeColor && leg.routeColor.startsWith("#") ? leg.routeColor : undefined }}
                    />
                    <div className="font-medium text-gray-900">
                      {leg.to.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectedRouteDetails;
