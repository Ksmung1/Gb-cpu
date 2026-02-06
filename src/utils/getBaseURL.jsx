export const getBaseURL = () => {
  return import.meta.env.VITE_MODE === "development"
    ? "https://us-central1-gamebar-official.cloudfunctions.net/api"
    : "https://us-central1-gamebar-official.cloudfunctions.net/api"; 

};
