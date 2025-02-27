"use client";

import { MapWidget } from "@/components/map/MapWidget";
import { UIProvider } from "@/contexts/uiContext";
import { MapProvider } from "@/contexts/mapContext";
import { AutocompleteDataProvider } from "@/contexts/DataContext/autocompleteDataContext";
import { OtpDataProvider } from "@/contexts/DataContext/routingDataContext";
import { StopmonitorDataProvider } from "@/contexts/DataContext/stopmonitorDataContext";
import { SettingsProvider } from "@/contexts/settingsContext";
import MainView from "@/components/MainView";



export default function Home() {
  return (
              <SettingsProvider initialLanguage={"en"}>
              <UIProvider>
              <MapProvider>
                <AutocompleteDataProvider>
                <OtpDataProvider>
                <StopmonitorDataProvider>
                <>
      <div id="app" style={{ width: "100%", height: "100%" }}>
        <MainView />
      </div>
      <style jsx global>{`
        html,
        body,
        #__next,
        #app {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </>


                  </StopmonitorDataProvider>
                  </OtpDataProvider>
                  </AutocompleteDataProvider>
                </MapProvider>
                </UIProvider>
                </SettingsProvider>
  );
}
