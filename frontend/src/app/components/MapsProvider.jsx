"use client";
import { LoadScriptNext } from "@react-google-maps/api";

export default function MapsProvider({ children }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return (
    <LoadScriptNext googleMapsApiKey={apiKey} libraries={["places"]}>
      {children}
    </LoadScriptNext>
  );
}
