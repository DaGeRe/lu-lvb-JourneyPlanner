"use client";

import { useEffect, useState, useRef } from "react";
import RoutePlanner from "./RoutePlanner";
import RouteView from "./RouteView";
import SelectedRouteDetails from "./SelectedRouteDetails";
import StationDetails from "./StationDetails";
import SearchStation from "./SearchStation";
import { useUIContext } from "@/contexts/uiContext";
import { useMapContext } from "@/contexts/mapContext";
import { Stop } from "@/api/nearbysearchService/dto/nearbysearchResponse";
import extractTrailingDigits from "@/utils/extractTrailingDigits";

const ControlPanel = () => {
  const { viewMode, setViewMode } = useUIContext();
  const { selectedStop, selectedNearbySearchItem, setSelectedNearbySearchItem, setSelectedStop } = useMapContext();

  // We'll store the stable Stop ID here.
  const [stableStopId, setStableStopId] = useState<string | null>(null);
  const [stableStopName, setStableStopName] = useState<string | null>(null);
  
  // Track the source of the station selection
  const [selectionSource, setSelectionSource] = useState<'map' | 'search' | null>(null);

  // When a new nearby search item is selected from the map
  useEffect(() => {
    if (selectedNearbySearchItem?.data instanceof Stop) {
      const newStopId = extractTrailingDigits(selectedNearbySearchItem.id);
      
      console.log("Setting stableStopId from map selection:", newStopId);
      setStableStopId(newStopId);
      setStableStopName(selectedNearbySearchItem.name);
      setSelectionSource('map');
      
      // Set the view mode to STATION
      // The UIContext will handle preserving the previous view mode
      console.log("Setting view mode to STATION from map selection");
      setViewMode("STATION");
    }
  }, [selectedNearbySearchItem, setViewMode]);

  // When a station is selected from search
  useEffect(() => {
    if (selectedStop) {
      console.log("Setting selection source to search");
      setSelectionSource('search');
      
      // No need to clear stableStopId here, as we're using selectionSource to determine which to use
    }
  }, [selectedStop]);

  // Clear selections when navigating away from STATION view
  useEffect(() => {
    if (viewMode !== "STATION") {
      // Clear all selections when navigating away from STATION view
      if (selectedNearbySearchItem) {
        console.log("Clearing selectedNearbySearchItem as we're no longer in STATION view");
        setSelectedNearbySearchItem(null);
      }
      
      if (selectedStop) {
        console.log("Clearing selectedStop as we're no longer in STATION view");
        setSelectedStop(null);
      }
      
      if (stableStopId) {
        console.log("Clearing stableStopId as we're no longer in STATION view");
        setStableStopId(null);
        setStableStopName(null);
      }
      
      // Reset selection source when navigating away
      setSelectionSource(null);
    }
  }, [viewMode, selectedNearbySearchItem, selectedStop, setSelectedNearbySearchItem, setSelectedStop]);

  // Determine which stop ID and name to use
  const effectiveStopId = selectionSource === 'search' ? selectedStop?.stop_id : stableStopId;
  const effectiveStopName = selectionSource === 'search' ? selectedStop?.stop_name : stableStopName;

  return (
    <div className="w-full h-full bg-white shadow-lg overflow-y-auto text-primary-blue">
      <div className="p-4 pb-32">  
        {viewMode === "DEFAULT" && <RoutePlanner setActiveView={setViewMode} />}
        {viewMode === "PLAN" && <RouteView setActiveView={setViewMode} />}
        {viewMode === "ITINERARY" && <SelectedRouteDetails />}
        {viewMode === "SEARCH_STATION" && <SearchStation setActiveView={setViewMode} />}
        {viewMode === "STATION" && effectiveStopId && (
          <StationDetails 
            stopId={effectiveStopId} 
            stopName={effectiveStopName || "Leipzig Hauptbahnhof"} 
          />
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
