
import { useStore } from "@/store/useStore";
import initialData from "@/data/store.json";

export const exportStoreToFile = () => {
  const state = useStore.getState();
  
  // Create export data
  const exportData = {
    products: state.products,
    branches: initialData.branches || [],
    regions: initialData.regions || [],
    streets: initialData.streets || [],
    exportDate: new Date().toISOString(),
    exportVersion: "1.0"
  };
  
  const jsonData = JSON.stringify(exportData, null, 2);
  
  // Create a blob from the JSON data
  const blob = new Blob([jsonData], { type: "application/json" });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement("a");
  link.href = url;
  link.download = "store.json";
  
  // Append the link to the document
  document.body.appendChild(link);
  
  // Click the link to trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
