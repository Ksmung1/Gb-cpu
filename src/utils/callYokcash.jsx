import axios from "axios";

export const callYokcash = async () => {
  console.log("Calling yokcash");
  const url = import.meta.env.VITE_BACKEND_URL;

  try {
    const res = await axios.post(`${url}/get-services`);
    const responseData = res.data;

    // Safely check if response has the expected structure
    if (
      responseData.status === true &&
      Array.isArray(responseData.data) &&
      responseData.data.length > 0
    ) {
      const csv = jsonToCSV(responseData.data);
      downloadCSV(csv, "yokcash-services.csv");
    } else {
      alert("No data found or API returned unexpected format.");
      console.log("Full response:", responseData);
    }
  } catch (err) {
    console.error("API call failed:", err);
  }
};

function jsonToCSV(data) {
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // header row
    ...data.map((row) =>
      headers.map((field) => `"${(row[field] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    ),
  ];
  return csvRows.join("\n");
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
