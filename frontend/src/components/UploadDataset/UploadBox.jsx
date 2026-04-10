import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import { datasetAPI } from "../../../services/api";
import { storageUtils } from "../../utils/storageUtils";

function UploadBox({ file, setFile, setData, setError, setDatasetId, setColumnTypes }) {
  const ALLOWED_TYPES = ["text/csv", "application/json"];
  const MAX_SIZE = 5 * 1024 * 1024;

  const handleFile = async (uploadedFile) => {
    if (!uploadedFile) return;

    setError("");
    setFile(null);
    setData(null);

    // Validation
    if (!ALLOWED_TYPES.includes(uploadedFile.type)) {
      setError("Invalid file format. Only CSV and JSON supported.");
      return;
    }

    if (uploadedFile.size > MAX_SIZE) {
      setError(`File too large. Maximum size: ${(MAX_SIZE / 1024 / 1024).toFixed(1)} MB`);
      return;
    }

    try {
      // Upload to backend
      const response = await datasetAPI.upload(uploadedFile);
      const result = response.data;

      // Store from backend response
      if (result?.dataset_id) {
        setDatasetId(result.dataset_id);
        storageUtils.setDatasetId(result.dataset_id);
      }

      if (result?.column_types) {
        storageUtils.setColumnTypes(result.column_types);

        // Convert to map format for easier lookup
        const map = {};
        result.column_types.forEach((col) => {
          map[col.column.trim().toLowerCase()] = col.type;
        });
        setColumnTypes(map);
      }

      // Parse file locally for preview
      if (uploadedFile.type === "text/csv") {
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setFile(uploadedFile);
            setData(results.data);
          },
          error: () => {
            setError("Failed to parse CSV file");
          }
        });
      } else if (uploadedFile.type === "application/json") {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target.result);
            if (Array.isArray(json)) {
              setFile(uploadedFile);
              setData(json);
            } else {
              setError("JSON must contain an array of objects");
            }
          } catch {
            setError("Invalid JSON format");
          }
        };

        reader.onerror = () => {
          setError("Failed to read file");
        };

        reader.readAsText(uploadedFile);
      }

    } catch (err) {
      console.error("[Upload Error]", err);
      setError(err.message || "Upload failed. Please try again.");
    }
  };

  const onDrop = (files) => {
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: false
  });

  return (
    <div
      {...getRootProps()}
      className={`mt-6 p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition
        ${file
          ? "border-green-500 bg-green-50"
          : isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
    >
      <input {...getInputProps()} />

      {!file ? (
        <>
          <p className="text-lg font-medium">
            {isDragActive
              ? "📁 Drop your file here..."
              : "📂 Drag & drop your dataset"}
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Supported formats: CSV, JSON  
          </p>
          
          <p className="text-xs text-gray-400 mt-1">
            Maximum file size: {(MAX_SIZE / 1024 / 1024).toFixed(1)} MB
          </p>
        </>
      ) : (
        <>
          <p className="text-green-700 font-semibold">
            ✅ File uploaded successfully
          </p>

          <p className="mt-2 font-medium">{file.name}</p>

          <p className="text-sm text-gray-500">
            {(file.size / 1024).toFixed(2)} KB
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Click or drag to replace
          </p>
        </>
      )}
    </div>
  );
}

export default UploadBox;