"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import { useUIContext } from "@/contexts/uiContext";
import { useMapContext } from "@/contexts/mapContext";
import { LayerManager } from "./layers/ILayer";
import { busLayerConfig, createItineraryLayerData } from "./layers/ItineraryLayer";
import { ViewMode } from "@/types/ViewMode";
import { stopsLayerConfig, stopsLabelsLayerConfig, stopsSource as stopsSourceConfig, createStopsLayerData, stopsSource } from "./layers/StopsLayer";
import {
    itinerarySource,
    walkLayerConfig,
    suburbLayerConfig,
    tramLayerConfig,
    trainLayerConfig,
    legStartEndLayerConfig,
    intermediateStopsLayerConfig
} from "./layers/ItineraryLayer";
import { Itinerary } from "@/types/Itinerary";
import { useStopmonitorDataContext } from "@/contexts/DataContext/stopmonitorDataContext";
import { OtpItinerary } from "@/api/routingService/dto/otpResponse";
import { mockOtpResponse } from "@/api/routingService/dto/__mock__/otpResponse.mock";
import { toOtpResponse } from "@/api/routingService/mappers";
import loadSVGImage from "@/utils/loadSVGImage";
import useLayersManager from "./utils/layersManager";


// --- Bounding Box Helpers ---

// Returns an extended bounding box (bufferFactor of 0.5 means 50% larger than view)
const getExtendedBounds = (map: maplibregl.Map, bufferFactor = 1) => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const center = bounds.getCenter();
  
    const lngDiff = ne.lng - sw.lng;
    const latDiff = ne.lat - sw.lat;
  
    return new maplibregl.LngLatBounds(
      [
        center.lng - (lngDiff * (1 + bufferFactor)) / 2,
        center.lat - (latDiff * (1 + bufferFactor)) / 2,
      ],
      [
        center.lng + (lngDiff * (1 + bufferFactor)) / 2,
        center.lat + (latDiff * (1 + bufferFactor)) / 2,
      ]
    );
  };

// Converts bounds into a comma-separated string: "minLng,minLat,maxLng,maxLat"
const boundsToString = (bounds: maplibregl.LngLatBounds) => {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;
  };

// --- Component Implementation ---

interface MapWidgetProps {
  onStopSelect: (stop: { stop_id: string; stop_name: string }) => void;
}

export const MapWidget: React.FC = ({ }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const layerManagerRef = useRef<LayerManager | null>(null);
    const { viewMode, setViewMode } = useUIContext();
    const { setSelectedStop } = useMapContext();
    const [mapLoaded, setMapLoaded] = useState(false);
    const { stopsData, fetchStops, loadingStops, errorStops } = useStopmonitorDataContext();
    const { setSelectedItinerary, selectedItinerary } = useMapContext();
  
    
    // State to hold the current query bounds (the extended bounding box used for querying)
    const currentQueryBoundsRef = useRef<maplibregl.LngLatBounds | null>(null);
    const [queryBoundsState, setQueryBoundsState] = useState<maplibregl.LngLatBounds | null>(null);
    
    const { updateSource, addLayerIfNotExists, removeLayer, activeSources, activeLayers } = useLayersManager(mapRef);


    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
    
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
            center: [12.377014, 51.340613],
            zoom: 14,
          });
    
        map.on("load", () => {
            // Initialize LayerManager and mapRef
            layerManagerRef.current = new LayerManager(map);
            mapRef.current = map;
    
            // Set initial extended bounds
            const extendedBounds = getExtendedBounds(map, 0.5);
            currentQueryBoundsRef.current = extendedBounds;
            setQueryBoundsState(extendedBounds); // trigger useEffect below
            //console.log("Initial query bounds:", extendedBounds);
    
            // Load Images
            const loadImages = () => {
                loadSVGImage("/lu-lvb-JourneyPlanner/icons/haltestelle.svg").then((image) => {
                    if (!map.hasImage("haltestelle")) {
                        map.addImage("haltestelle", image as HTMLImageElement | ImageBitmap);
                    }
                }).catch((error) => {
                    throw error;
                });
            };
            loadImages();

            // Set up moveend listener
            map.on("moveend", () => {
                console.log("Map moveend event");
                const currentViewBounds = map.getBounds();
                if (!currentQueryBoundsRef.current || !currentViewBounds) return;
                //console.log("Map bounds:", currentViewBounds);
    
                if (
                    !currentQueryBoundsRef.current.contains(currentViewBounds.getNorthEast()) ||
                    !currentQueryBoundsRef.current.contains(currentViewBounds.getSouthWest())
                ) {
                    const newExtendedBounds = getExtendedBounds(map, 0.5);
                    currentQueryBoundsRef.current = newExtendedBounds;
                    setQueryBoundsState(newExtendedBounds); // update state to trigger useEffect
                    // if (newExtendedBounds)
                    //     console.log("New stops query due to map move:", boundsToString(newExtendedBounds));
                }
            });

            // Click listener for Mapbox pre-loaded layers
            map.on('click', (e) => {
                // const features = map.queryRenderedFeatures(e.point);
                // if (features && features.length > 0) {
                // const feature = features[0];
                // if (feature.geometry.type === 'Point' || feature.geometry.type === 'LineString' || feature.geometry.type === 'Polygon') {
                //     if (feature.geometry.coordinates) {
                //     const coordinates = feature.geometry.coordinates;
                //     console.log('Clicked coordinates:', coordinates, 'of type:', feature.geometry.type);
                //     }
                // } else {
                //     console.log("Geometry type is not a Point, LineString, or Polygon");
                // }

                // }
            });
    
            setMapLoaded(true);
            loadLayers(mapRef, layerManagerRef.current, viewMode, stopsData, selectedItinerary);
        });

        map.on("error", (e) => {
            console.error("Map loading error:", e);
          });
    
        return () => map.remove();
    }, []);
    
    // React to changes in queryBoundsState
    useEffect(() => {
        console.log("queryBounds:", queryBoundsState);
        
        if (queryBoundsState && mapRef.current) {
            const bboxString = boundsToString(queryBoundsState);
            fetchStopsData()
        }
    }, [queryBoundsState]);
    
    // Fetch stops data
    const fetchStopsData = async () => {
        if (!currentQueryBoundsRef.current) return;
                
        await fetchStops(boundsToString(currentQueryBoundsRef.current));
        
        if (errorStops) {
            console.error("Error fetching stops:", errorStops);
            return;
        }
    };

    // React to viewmode changes
    useEffect(() => {
        if (mapRef.current) {
            loadLayers(mapRef, layerManagerRef.current, viewMode, stopsData, selectedItinerary);
        }
    }, [viewMode]);

    // React to stopsData being loaded
    useEffect(() => {
       // console.log("Stops Data Updated:", stopsData);
        
        if (!loadingStops && stopsData) {
            console.log("Stops data is available, creating layers...");
            loadLayers(mapRef, layerManagerRef.current, viewMode, stopsData, selectedItinerary);
        } else {
            console.warn("Stops data not ready yet.");
        }
    }, [stopsData, loadingStops]);


    const loadLayers = (
        mapRef: React.MutableRefObject<maplibregl.Map | null>,
        layerManager: LayerManager | null,
        viewMode: ViewMode,
        stopsData: any,
        itinerary: Itinerary | null
    ) => {
        if (!mapRef.current) return;
    
        if (["DEFAULT", "ITINERARY", "PLAN", "STATION"].includes(viewMode)) {
            updateStopsLayers(mapRef, layerManager, stopsData);
        }
    
        if (viewMode === "ITINERARY") {
            updateItineraryLayers(mapRef, layerManager, itinerary);
        } else {
            removeItineraryLayers(mapRef, layerManager);
        }
    
        mapRef.current.resize();
    };

    
    const updateStopsLayers = (mapRef: React.MutableRefObject<maplibregl.Map | null>, layerManager: LayerManager | null, stopsData: any) => {
        if (!stopsData) return;
    
        const geojsonData = createStopsLayerData(stopsData);
        updateSource("stops-source", geojsonData);
    
        addLayerIfNotExists(stopsLayerConfig);
        addLayerIfNotExists(stopsLabelsLayerConfig);
    };

    
    const updateItineraryLayers = (mapRef: React.MutableRefObject<maplibregl.Map | null>, layerManager: LayerManager | null, itinerary: Itinerary | null) => {
        if (!itinerary) return;
    
        const geojsonData = createItineraryLayerData(itinerary);
        updateSource("itinerary-source", geojsonData);
    
        const layers = [walkLayerConfig, suburbLayerConfig, tramLayerConfig, trainLayerConfig, legStartEndLayerConfig, intermediateStopsLayerConfig, busLayerConfig];
        layers.forEach(addLayerIfNotExists);
    };

    const removeItineraryLayers = (mapRef: React.MutableRefObject<maplibregl.Map | null>, layerManager: LayerManager | null) => {
        const layers = [walkLayerConfig, suburbLayerConfig, tramLayerConfig, trainLayerConfig, legStartEndLayerConfig, intermediateStopsLayerConfig, busLayerConfig];
        layers.forEach(layer => removeLayer(layer.id));
    
        activeSources.delete("itinerary-source");
    };
    

      

    //console.log("Rendering MapWidget. Map container ref:", mapContainerRef.current);
    return (
        <div
          ref={mapContainerRef}
          role="region"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
         }}
        />
      );};

export default MapWidget;
