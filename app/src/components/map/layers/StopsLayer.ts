//fetch stops info a geojson 

// DEPRECATED - REPLACED WITH NearbySearchLayer.tsx

import { StopsResponse } from "@/api/stopmonitorService/dto/stopmonitorResponse";
import { GeoJSONSourceSpecification, SourceSpecification } from "maplibre-gl";


// Function to generate GeoJSON dynamically from API response
export const createStopsLayerData = (stops: StopsResponse): GeoJSON.FeatureCollection => {
  const stopsGeoJson = stops.toGeoJson();
  console.log("Stops GeoJSON:", stopsGeoJson);
  return stopsGeoJson;
};

// Stops source definition
export const stopsSource: GeoJSONSourceSpecification = {
  type: "geojson",
  data: {
    type: "FeatureCollection",
    features: [],
  },
};




  // export const stopsLayerConfig: LayerConfig = {
  //   id: "stops-layer",
  //   type: "symbol",
  //   sourceId: stopsSource.id,
  //   imageUrl: "front-of-bus.png",
  //   imageId: "bus-icon",
  //   iconSize: 0.05,
  //   interactive: true,
  //   onClick: (e) => {
  //     const feature = e.features?.[0];
  //     if (feature) {
  //       console.log("Stop clicked:", feature.properties?.stopId);
  //     }
  //   },
  // };

  import { LayerSpecification } from "maplibre-gl";

  // Stops Layer (Circle Style)
  export const stopsLayerConfig: LayerSpecification = {
    id: "stops-layer",
    type: "circle",
    source: "stops-source",
    minzoom: 14,
    maxzoom: 22,
    paint: {
      "circle-radius": 4,
      "circle-color": "#ff0000",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#000",
      "circle-opacity": 1,
      "circle-stroke-opacity": 1,
    },
  };
  
  // Stops Labels Layer
  export const stopsLabelsLayerConfig: LayerSpecification = {
    id: "stops-labels",
    type: "symbol",
    source: "stops-source",
    minzoom: 15,
    maxzoom: 22,
    layout: {
      "text-field": ["get", "stop_name"],
      "text-size": 12,
      "text-offset": [0, 1.2],
      "text-anchor": "top",
    },
    paint: {
      "text-color": "#000",
      "text-halo-color": "#fff",
      "text-halo-width": 1,
      "text-opacity": 1,
    },
  };
  
  