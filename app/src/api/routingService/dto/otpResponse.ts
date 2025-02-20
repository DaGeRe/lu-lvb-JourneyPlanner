import { GeoJsonConvertible } from "@/types/GeoJsonConvertible";
import { RequestParameters } from "./otpRequest";
import { TransportMode } from "@/types/TransportMode";
import { toPlan } from "@/api/routingService/mappers";

// dto/otpResponse.ts

export class OtpResponse {
    constructor(
        public RetStatus: { Value: string; Comments?: string },
        public requestParameters: RequestParameters,
        public plan: Plan
    ) {
    }
}

export class Plan {
    constructor(
        public date: number | undefined,
        public from: Location,
        public to: Location,
        public itineraries: OtpItinerary[]
    ) {
    }
}


export class Location extends GeoJsonConvertible {
    constructor(
        public name: string,
        public lat: number,
        public lon: number
    ) {
        super();
    }

    toGeoJsonFeature(type: string): object {
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [this.lon, this.lat],
            },
            properties: {
                name: this.name,
                type: type,
            },
        };
    }

    toGeoJson(): string {
        return JSON.stringify(this.toGeoJsonFeature("Location"));
    }
}

export class OtpItinerary extends GeoJsonConvertible {
    constructor(
        public duration: number,
        public startTime: number,
        public endTime: number,
        public walkTime: number,
        public transitTime: number,
        public waitingTime: number,
        public walkDistance: number,
        public transfers: number,
        public legs: Leg[],
        public zoneInfo?: ZoneInfo
    ) {
        super();
    }

    toGeoJsonFeatures(): object[] {
        return this.legs.flatMap((leg) => leg.toGeoJsonFeatures());
    }

    toGeoJson(): string {
        const geojson = {
            type: "FeatureCollection",
            features: this.toGeoJsonFeatures(),
        };
        return JSON.stringify(geojson, null, 2);
    }
}

export class Leg extends GeoJsonConvertible {
    constructor(
        public startTime: number,
        public endTime: number,
        public departureDelay: number,
        public arrivalDelay: number,
        public realTime: boolean,
        public distance: number,
        public mode: TransportMode,
        public route: string,
        public from: Location,
        public to: Location,
        public legGeometry: LegGeometry,
        public duration: number,
        public transitLeg: boolean,
        public intermediateStops?: Location[],
        public rentedBike?: boolean,
        public alerts?: Alert[]
    ) {
        super();
    }

    toGeoJsonFeatures(): object[] {
        const features = [
            this.from.toGeoJsonFeature("Leg Start"),
            this.to.toGeoJsonFeature("Leg End"),
        ];

        // Add the leg geometry as a LineString
        if (this.legGeometry.points.length > 0) {
            features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: this.legGeometry.points.map((point) => [point.lon, point.lat]),
                },
                properties: {
                    mode: this.mode,    
                    route: this.route,
                    distance: this.distance,
                    duration: this.duration,
                },
            });
        }

        // Add intermediate stops if available
        if (this.intermediateStops) {
            features.push(
                ...this.intermediateStops.map((stop) => stop.toGeoJsonFeature("Intermediate Stop"))
            );
        }

        return features;
    }

    toGeoJson(): string {
        const geojson = {
            type: "FeatureCollection",
            features: this.toGeoJsonFeatures(),
        };
        return JSON.stringify(geojson, null, 2);
    }
}

export class LegGeometry extends GeoJsonConvertible {
    constructor(public points: { lat: number; lon: number }[]) {
        super();
    }

    toGeoJson(): string {
        const geojson = {
            type: "LineString",
            coordinates: this.points.map((point) => [point.lon, point.lat]),
        };
        return JSON.stringify(geojson, null, 2);
    }
}

export class ZoneInfo extends GeoJsonConvertible {
    constructor(
        public zones: string[],
        public orderedZones: string[],
        public shortDistanceTicket: boolean
    ) {
        super();
    }

    toGeoJson(): string {
        const geojson = {
            type: "Feature",
            properties: {
                zones: this.zones,
                orderedZones: this.orderedZones,
                shortDistanceTicket: this.shortDistanceTicket,
            },
        };
        return JSON.stringify(geojson, null, 2);
    }
}

export class Alert extends GeoJsonConvertible {
    constructor(
        public effectiveStartDate: number,
        public effectiveEndDate: number,
        public alertDescriptionText: string,
        public alertCategory: number,
        public alertUrl?: string,
        public alertHeaderText?: string
    ) {
        super();
    }

    toGeoJson(): string {
        const geojson = {
            type: "Feature",
            properties: {
                effectiveStartDate: this.effectiveStartDate,
                effectiveEndDate: this.effectiveEndDate,
                alertDescriptionText: this.alertDescriptionText,
                alertCategory: this.alertCategory,
                alertUrl: this.alertUrl,
                alertHeaderText: this.alertHeaderText,
            },
        };
        return JSON.stringify(geojson, null, 2);
    }
}
