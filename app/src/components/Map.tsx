"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { createItineraryLayer, createItineraryLayerData } from "./map/layers/ItineraryLayer";
import stopsLayer from "./map/layers/StopsLayer";
import { useUIContext } from "@/contexts/uiContext";
import { useMapContext } from "@/contexts/mapContext";
import { LayerManager } from "./map/layers/ILayer";
import { GeoJSON } from "geojson";
import { fetchOtpData } from "@/api/routingService/routingService";

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const layerManagerRef = useRef<LayerManager | null>(null);

  // Get context values
  const { viewMode } = useUIContext();
  const { visibleLayers, selectedStop, setSelectedStop } = useMapContext();

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Ensure Mapbox token exists
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      console.error("Mapbox token is missing.");
    }
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [12.37701425222998, 51.3406130352673],
      zoom: 12,
    });

    map.on("style.load", () => {
      console.log("Initializing layers...");
      layerManagerRef.current = new LayerManager(map);
      mapRef.current = map;
      loadLayers();
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      loadLayers();
    }
  }, [viewMode]); // Reload layers when view mode changes

  const createStopsLayer = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    console.log("Creating Stops Layer...");
    const stopsGeoJson = stopsLayer() as GeoJSON.FeatureCollection;
    //("Stops GeoJSON:", stopsGeoJson);

    if (!map.getSource("stops-source")) {
      map.addSource("stops-source", { type: "geojson", data: stopsGeoJson });
    }

    if (!map.getLayer("stops-layer")) {
      map.addLayer({
        id: "stops-layer",
        type: "circle",
        source: "stops-source",
        paint: {
          "circle-radius": 3,
          "circle-color": "#f3780b",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#f3780b",
        },
      });

      // Enable Click Interaction
      map.on("click", "stops-layer", (e) => {
        const feature = e.features?.[0];
        if (feature) {
          console.log("Clicked Stop:", feature.properties?.stopId);
          setSelectedStop(feature.properties?.stopId);
        }
      });

      // Hover Interaction
      map.on("mouseenter", "stops-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "stops-layer", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  };

  const itineraryGeoJson = createItineraryLayerData(); // Hook must be at top level

  const loadLayers = async () => {
    console.log("CHECK 2");
    if (!mapRef.current || !layerManagerRef.current) return;
    const map = mapRef.current;

    console.log("Reloading layers...");
    console.log("Visible Layers:", visibleLayers);
    console.log("View Mode:", viewMode);

    if (viewMode === "DEFAULT") {
      console.log("Fetching itinerary data...");
      console.log("CHECK 3")
      if (!itineraryGeoJson) {
        console.warn("No itinerary data available.");
        return;
      }

      const itinerary = itineraryGeoJson as GeoJSON.FeatureCollection;
      //const itineraryLayer = createItineraryLayer(itineraryGeoJson);

      //if (!map.getSource("itinerary-source")) {
      console.log("CHECK 4");
        map.addSource("itinerary-source", { type: "geojson", data: itinerary })
      //}

      //if (!map.getLayer("itinerary-layer")) {
        map.addLayer({
          id: "itinerary-layer",
          type: "line",
          source: "itinerary-source",
        });
      //}
    }
  };



  return <div ref={mapContainer} style={{ width: "700px", height: "700px" }} />;
};

export default Map;
