import Papa from "papaparse";
import { useDropzone } from "react-dropzone";

function UploadBox({ file, setFile, setData, setError, setDatasetId }) {
  const allowedTypes = [
    "text/csv",
    "application/json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const MAX_SIZE = 5 * 1024 * 1024;

  const handleFile = async (file) => {
  if (!file) return;

  setError("");
  setFile(null);
  setData(null);

  if (!allowedTypes.includes(file.type)) {
    setError("Invalid file format.");
    return;
  }

  if (file.size > MAX_SIZE) {
    setError("File too large.");
    return;
  }

  try {
    // 🔥 STEP 1: Upload to backend
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/dataset/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    console.log("Backend response:", result);

    // ✅ STEP 2: Store dataset_id
    if (result && result.dataset_id) {
  setDatasetId(result.dataset_id);

  // 🔥 ADD THIS
  localStorage.setItem("dataset_id", result.dataset_id);
}

    // 🔥 STEP 3: Parse locally (for preview)

    // CSV
    if (file.type === "text/csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setFile(file);
          setData(results.data);
        },
      });
    }

    // JSON
    else if (file.type === "application/json") {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setFile(file);
          setData(json);
        } catch {
          setError("Invalid JSON");
        }
      };

      reader.readAsText(file);
    } else {
      setError("XLSX support coming soon");
    }

  } catch (err) {
    console.error(err);
    setError("Upload failed");
  }
};

  const onDrop = (files) => {
    handleFile(files[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
  <div
    {...getRootProps()}
    className={`mt-6 p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition
    ${
      file
        ? "border-green-500 bg-green-50"
        : isDragActive
        ? "border-blue-500 bg-blue-50"
        : "border-gray-300 bg-white"
    }`}
  >
    <input {...getInputProps()} />

    {!file ? (
      <>
        <p className="text-lg font-medium">
          {isDragActive
            ? "Drop your file here..."
            : "Drag & drop your dataset"}
        </p>

        <p className="text-sm text-gray-500 mt-2">
          CSV, XLSX, JSON
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
          Click or drag to replace file
        </p>
      </>
    )}
  </div>
);
}

export default UploadBox;