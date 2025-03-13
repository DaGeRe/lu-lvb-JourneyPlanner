import { useState, useEffect, SetStateAction } from "react";
import { Filter, ArrowUpDown, ChevronDown, ChevronUp, Calendar } from "lucide-react"; // Icons
import TramLogo from "../../../public/icons/otp-icons/Tram-Logo.svg";
import S_BahnLogo from "../../../public/icons/otp-icons/S-Bahn-Logo.svg";
import TrainLogo from "../../../public/icons/otp-icons/Train.svg";
import BusLogo from "../../../public/icons/otp-icons/Bus-Logo.svg"; 
import TransportFilter from "./filters/TransportFilter";
import DepartureFilter from "./filters/DepartureFilter";
import { useSettingsContext } from "@/contexts/settingsContext"; // Import context
import { useAutocompleteDataContext } from "@/contexts/DataContext/autocompleteDataContext";
import { AutocompleteItem } from "@/api/autocompleteService/dto/autocompleteitemResponse";
import { TransportMode } from "@/types/TransportMode";
import Bike from "../../../public/icons/otp-icons/Bike.svg";
import PersonStanding from "../../../public/icons/otp-icons/Walk.svg";
import Car from "../../../public/icons/otp-icons/Car.svg";
import { useOtpDataContext } from "@/contexts/DataContext/routingDataContext";
import { RequestParameters } from "@/api/routingService/dto/otpRequest";
import { ViewMode } from "@/types/ViewMode";
import SuggestionContainer from "./widgets/SuggestionContainer";
import { useLocationContext } from "@/contexts/locationContext";

type TransportOption = {
  type: string;
  logo: any;
  mode: TransportMode;
};

const transportOptions: TransportOption[] = [
  { type: "Tram", logo: TramLogo, mode: "TRAM" },
  { type: "S-Bahn", logo: S_BahnLogo, mode: "SUBURB" },
  { type: "Bus", logo: BusLogo, mode: "BUS" },
  { type: "Bike", logo: Bike, mode: "BIKE" },
  { type: "Walk", logo: PersonStanding, mode: "WALK" },
  { type: "Car", logo: Car, mode: "CAR" },
  { type: "Train", logo: TrainLogo, mode: "TRAIN" }
];

interface SelectedLocation {
  name: string;
  coordinates: string; // Format: "lat,lon"
}

const RoutePlanner = ({ setActiveView }: { setActiveView: (view: ViewMode) => void }) => {
  const { translations, transportModes, toggleTransportMode } = useSettingsContext();
  const { 
    autocompleteData, 
    fetchAutocompleteData, 
    loadingAutocomplete,
    errorAutocomplete,
    clearState: clearAutocompleteData 
  } = useAutocompleteDataContext();
  const { 
    fetchOtpData, 
    lastOrigin, 
    lastDestination, 
    lastOriginCoordinates, 
    lastDestinationCoordinates,
    setLastSearchParams 
  } = useOtpDataContext();
  const { currentLocation, locationIsEnabled } = useLocationContext();

  // Initialize with values from context if available
  const [origin, setOrigin] = useState(lastOrigin || "");
  const [destination, setDestination] = useState(lastDestination || "");
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDepartureFilter, setShowDepartureFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);
  const [isArrival, setIsArrival] = useState(false);
  const [originAutocompleteData, setOriginAutocompleteData] = useState<AutocompleteItem[]>([]);
  const [destinationAutocompleteData, setDestinationAutocompleteData] = useState<AutocompleteItem[]>([]);
  
  // Initialize with values from context if available
  const [selectedOrigin, setSelectedOrigin] = useState<SelectedLocation | null>(
    lastOrigin && lastOriginCoordinates 
      ? { name: lastOrigin, coordinates: lastOriginCoordinates } 
      : null
  );
  const [selectedDestination, setSelectedDestination] = useState<SelectedLocation | null>(
    lastDestination && lastDestinationCoordinates 
      ? { name: lastDestination, coordinates: lastDestinationCoordinates } 
      : null
  );
  
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOriginSelected, setIsOriginSelected] = useState(!!lastOrigin);
  const [isDestinationSelected, setIsDestinationSelected] = useState(!!lastDestination);
  
  // Track which field is currently being searched
  const [currentSearchField, setCurrentSearchField] = useState<"origin" | "destination" | null>(null);

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setDefaultDate(now);
  }, []);
  
  const isDepartureModified = selectedDate && defaultDate 
    ? selectedDate.getTime() !== defaultDate.getTime() || isArrival
    : false;
    
  const formattedTime = selectedDate
    ? selectedDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : '';

  // Log transport modes changes
  useEffect(() => {
    console.log('Current Transport Modes:', transportModes);
  }, [transportModes]);

  const toggleFilter = (type: string) => {
    const modeMap: { [key: string]: TransportMode } = {
      "Tram": "TRAM",
      "S-Bahn": "SUBURB",
      "Bus": "BUS",
      "Bike": "BIKE",
      "Walk": "WALK",
      "Car": "CAR",
      "Train": "TRAIN"
    };

    const mode = modeMap[type];
    if (mode) {
      console.log('Toggling transport mode:', { type, mappedMode: mode });
      toggleTransportMode(mode);
    }
  };

  const swapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
    const tempOrigin = selectedOrigin;
    setSelectedOrigin(selectedDestination);
    setSelectedDestination(tempOrigin);
  };

  // Functions to trigger fetch of suggestions. The returned autocomplete data will be processed by the effect below.
  const fetchOriginSuggestions = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      setShowDestinationSuggestions(false);
      setCurrentSearchField("origin");
      // Clear previous autocomplete data
      setOriginAutocompleteData([]);
      await clearAutocompleteData();
      await fetchAutocompleteData({ 
        search: query,
        format: "JSON",
        pointType: "N,P,S,W"
      });
    } catch (error) {
      console.error('Error fetching origin suggestions:', error);
    }
  };

  const fetchDestinationSuggestions = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      setShowOriginSuggestions(false);
      setCurrentSearchField("destination");
      setDestinationAutocompleteData([]);
      await clearAutocompleteData();
      await fetchAutocompleteData({ 
        search: query,
        format: "JSON",
        pointType: "N,P,S,W"
      });
    } catch (error) {
      console.error('Error fetching destination suggestions:', error);
    }
  };

  // Effect to trigger suggestion update based on the latest autocomplete data.
  useEffect(() => {
    if (loadingAutocomplete) {
      console.warn("Autocomplete data is still loading...");
      return;
    }
    if (errorAutocomplete) {
      console.error("Error fetching autocomplete data:", errorAutocomplete);
      return;
    }
    if (currentSearchField === "origin" && autocompleteData) {
      setOriginAutocompleteData(autocompleteData);
      setShowOriginSuggestions(true);
    } else if (currentSearchField === "destination"&& autocompleteData) {
      setDestinationAutocompleteData(autocompleteData);
      setShowDestinationSuggestions(true);
    }
  }, [autocompleteData, currentSearchField, loadingAutocomplete, errorAutocomplete]);

  // Effects to fetch suggestions on input change
  useEffect(() => {
    if (isOriginSelected) return;
    if (origin.length >= 2) {
      fetchOriginSuggestions(origin);
    } else {
      setShowOriginSuggestions(false);
      setOriginAutocompleteData([]);
    }
  }, [origin]);

  useEffect(() => {
    if (isDestinationSelected) return;
    if (destination.length >= 2) {
      fetchDestinationSuggestions(destination);
    } else {
      setShowDestinationSuggestions(false);
      setDestinationAutocompleteData([]);
    }
  }, [destination]);

  // Clear autocomplete data when focusing on input fields
  const handleOriginFocus = () => {
    setCurrentSearchField("origin");
    setDestinationAutocompleteData([]);
    clearAutocompleteData();
    if (origin.length >= 2 && !isOriginSelected) {
      fetchOriginSuggestions(origin);
    }
  };

  const handleDestinationFocus = () => {
    setCurrentSearchField("destination");
    setOriginAutocompleteData([]);
    clearAutocompleteData();
    if (destination.length >= 2 && !isDestinationSelected) {
      fetchDestinationSuggestions(destination);
    }
  };

  const handleSuggestionClick = (suggestion: AutocompleteItem, isOrigin: boolean) => {

    let SelectedLocation: SetStateAction<SelectedLocation | null>;

    if (suggestion instanceof AutocompleteItem) {
      const fullAddress = `${suggestion.data}`;
      const coordinates = `${suggestion.lat},${suggestion.lon}`;
      SelectedLocation = { name: fullAddress, coordinates };
    } 
    else {
      return;  
    }
  
    if (isOrigin) {
      setOrigin(SelectedLocation.name);
      setSelectedOrigin(SelectedLocation);
      setIsOriginSelected(true);
      setShowOriginSuggestions(false);
    } else {
      setDestination(SelectedLocation.name);
      setSelectedDestination(SelectedLocation);
      setIsDestinationSelected(true);
      setShowDestinationSuggestions(false);
    }
    
    // Clear autocomplete data and reset state
    setOriginAutocompleteData([]); 
    setDestinationAutocompleteData([]);
    clearAutocompleteData();
    setSelectedIndex(-1);
    setCurrentSearchField(null);
  
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };
  
  // Click-outside handler for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.suggestions-container') && !target.closest('.location-input')) {
        setShowOriginSuggestions(false);
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSeeRoutes = async () => {
    if (!selectedOrigin || !selectedDestination) {
      console.error('Origin or destination not selected');
      return;
    }

    try {
      setLastSearchParams(
        selectedOrigin.name,
        selectedDestination.name,
        selectedOrigin.coordinates,
        selectedDestination.coordinates,
        transportModes, 
        selectedDate ? selectedDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-') : "",
        selectedDate ? selectedDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }) : ""
      );

      const params: Partial<RequestParameters> = {
        From: selectedOrigin.coordinates,
        To: selectedDestination.coordinates,
        Travelmode: transportModes,
        numItineraries: 5,
        arriveBy: isArrival
      };

      if (selectedDate) {
        params.date = selectedDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');

        params.time = selectedDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }

      console.log('Fetching routes with params:', {
        From: params.From,
        To: params.To,
        Travelmode: params.Travelmode,
        date: params.date,
        time: params.time,
        arriveBy: params.arriveBy
      });

      await fetchOtpData(params);
      setActiveView("PLAN");
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    suggestions: AutocompleteItem[],
    isOrigin: boolean
  ) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // If we're at the current location option (-2) or before it (-1), move to the first suggestion (0)
        // Otherwise, move down through the suggestions
        setSelectedIndex(prev => {
          if (prev < 0) return 0;
          return prev < suggestions.length - 1 ? prev + 1 : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        // If we're at the first suggestion (0), move to the current location option (-2)
        // Otherwise, move up through the suggestions
        setSelectedIndex(prev => {
          if (prev === 0 && locationIsEnabled) return -2;
          return prev > -2 ? prev - 1 : -2;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex === -2 && locationIsEnabled) {
          // Handle current location selection
          if (isOrigin) {
            handleUseCurrentLocationForOrigin();
          } else {
            handleUseCurrentLocationForDestination();
          }
        } else if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex], isOrigin);
        }
        setSelectedIndex(-1);
        break;
      case 'Escape':
        if (isOrigin) {
          setShowOriginSuggestions(false);
        } else {
          setShowDestinationSuggestions(false);
        }
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (isOrigin) {
          setShowOriginSuggestions(false);
        } else {
          setShowDestinationSuggestions(false);
        }
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle using current location for origin
  const handleUseCurrentLocationForOrigin = () => {
    if (!currentLocation || !locationIsEnabled) {
      console.error('Current location is not available');
      return;
    }

    const coordinates = `${currentLocation.coords.lat},${currentLocation.coords.lon}`;
    // Use the translated text for current location
    const locationName = translations?.ControlPanel?.planner?.currentLocation || "Current Location";
    
    setOrigin(locationName);
    setSelectedOrigin({ name: locationName, coordinates });
    setIsOriginSelected(true);
    setShowOriginSuggestions(false);
    
    // Clear autocomplete data and reset state
    setOriginAutocompleteData([]);
    clearAutocompleteData();
    setSelectedIndex(-1);
    setCurrentSearchField(null);
  };

  // Handle using current location for destination
  const handleUseCurrentLocationForDestination = () => {
    if (!currentLocation || !locationIsEnabled) {
      console.error('Current location is not available');
      return;
    }

    const coordinates = `${currentLocation.coords.lat},${currentLocation.coords.lon}`;
    // Use the translated text for current location
    const locationName = translations?.ControlPanel?.planner?.currentLocation || "Current Location";
    
    setDestination(locationName);
    setSelectedDestination({ name: locationName, coordinates });
    setIsDestinationSelected(true);
    setShowDestinationSuggestions(false);
    
    // Clear autocomplete data and reset state
    setDestinationAutocompleteData([]);
    clearAutocompleteData();
    setSelectedIndex(-1);
    setCurrentSearchField(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      <h2 className="text-lg font-bold">
        {translations?.ControlPanel?.planner?.title || "Plan Your Journey"}
      </h2>

      {/* Inputs and swap button */}
      <div className="flex flex-col gap-4 relative">
        <div className="relative">
          <input
            type="text"
            placeholder={translations?.ControlPanel?.planner?.origin || "Origin"}
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setIsOriginSelected(false);
              setSelectedOrigin(null);
              setSelectedIndex(-1);
            }}
            onKeyDown={(e) => handleKeyDown(e, originAutocompleteData, true)}
            onFocus={handleOriginFocus}
            className="location-input w-full p-2 border rounded"
          />
          {showOriginSuggestions && (
            <SuggestionContainer
              suggestions={originAutocompleteData}
              loading={loadingAutocomplete && currentSearchField === "origin"}
              selectedIndex={selectedIndex}
              onSuggestionClick={(suggestion: AutocompleteItem) =>
                handleSuggestionClick(suggestion, true)
              }
              onCurrentLocationClick={handleUseCurrentLocationForOrigin}
              showCurrentLocation={locationIsEnabled}
              currentLocationLabel={translations?.ControlPanel?.planner?.currentLocation || "Current Location"}
              currentLocationDescription={translations?.ControlPanel?.planner?.useCurrentLocation || "Use your current location"}
            />
          )}
        </div>

        <button
          onClick={swapLocations}
          className="absolute right-[-16px] top-1/2 transform -translate-y-1/2 bg-primary-yellow text-primary-blue p-3 rounded-full hover:bg-primary-yellow/80 transition-colors z-10 shadow-md"
        >
          <ArrowUpDown size={24} />
        </button>

        <div className="relative">
          <input
            type="text"
            placeholder={translations?.ControlPanel?.planner?.destination || "Destination"}
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setIsDestinationSelected(false);
              setSelectedDestination(null);
              setSelectedIndex(-1);
            }}
            onKeyDown={(e) => handleKeyDown(e, destinationAutocompleteData, false)}
            onFocus={handleDestinationFocus}
            className="location-input w-full p-2 border rounded"
          />
          {showDestinationSuggestions && (
            <SuggestionContainer
              suggestions={destinationAutocompleteData}
              loading={loadingAutocomplete && currentSearchField === "destination"}
              selectedIndex={selectedIndex}
              onSuggestionClick={(suggestion: AutocompleteItem) =>
                handleSuggestionClick(suggestion, false)
              }
              onCurrentLocationClick={handleUseCurrentLocationForDestination}
              showCurrentLocation={locationIsEnabled}
              currentLocationLabel={translations?.ControlPanel?.planner?.currentLocation || "Current Location"}
              currentLocationDescription={translations?.ControlPanel?.planner?.useCurrentLocation || "Use your current location"}
            />
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowDepartureFilter(!showDepartureFilter)}
          className="flex items-center justify-between bg-primary-yellow text-primary-blue px-4 py-2 rounded-md transition-all hover:bg-primary-yellow/80"
          suppressHydrationWarning
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span>
              {isDepartureModified
                ? translations?.ControlPanel?.planner?.filters?.departureAt?.replace("{time}", formattedTime) ||
                  `Departure at ${formattedTime}`
                : translations?.ControlPanel?.planner?.filters?.departureNow || "Depart Now"}
            </span>
          </div>
          {showDepartureFilter ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between bg-primary-yellow text-primary-blue px-4 py-2 rounded-md transition-all hover:bg-primary-yellow/80"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} />
            <span>{translations?.ControlPanel?.planner?.filters?.transportButton || "Transport"}</span>
          </div>
          {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {showDepartureFilter && (
        <DepartureFilter 
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isArrival={isArrival}
          setIsArrival={setIsArrival}
        />
      )}
      {showFilters && (
        <TransportFilter 
          activeFilters={Object.fromEntries(
            transportOptions.map(option => [
              option.type,
              transportModes.includes(option.mode)
            ])
          )}
          toggleFilter={toggleFilter}
        />
      )}

      <button 
        onClick={handleSeeRoutes}
        disabled={!selectedOrigin || !selectedDestination}
        className={`p-2 rounded w-full transition-colors ${
          !selectedOrigin || !selectedDestination 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-primary-yellow text-primary-blue hover:bg-primary-yellow/80'
        }`}
      >
        {translations?.ControlPanel?.planner?.seeRoutes || "See Routes"}
      </button>
    </div>
  );
};

export default RoutePlanner;
  
