import { useState, useRef } from "react";
import axios from "axios";
import { Upload as UploadIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_DB_API_URL;
const dbApiKey = import.meta.env.VITE_DB_API_KEY;
const s3ApiUrl = import.meta.env.VITE_S3_API_URL;
const s3ApiKey = import.meta.env.VITE_S3_API_KEY;

const orderTypeOptions = [
  "SELECT ONE",
  "OPORD",
  "FRAGO",
  "WARNO"
];

const fileTypes = [".pdf", ".docx"];

function validateFy(fy) {
  return /^FY\d{2}$/i.test(fy);
}
function validateOrderType(type) {
  return ["OPORD", "FRAGO", "WARNO"].includes(type);
}
function validateOrderNumber(num) {
  return /^\d{2}-\d{3}$/.test(num);
}
function validateTitle(title) {
  return !!title.trim();
}
function validateFile(file) {
  if (!file) return false;
  const ext = file.name.toLowerCase().slice(-5);
  return fileTypes.some(type => file.name.toLowerCase().endsWith(type));
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export default function Upload() {
  const [fy, setFy] = useState("");
  const [orderType, setOrderType] = useState(orderTypeOptions[0]);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFy("");
    setOrderType(orderTypeOptions[0]);
    setOrderNumber("");
    setOrderDate("");
    setTitle("");
    setFile(null);
    setErrors({});
    setSuccessMsg("");
    setUploadError("");
  };

  const handleFileChange = (e) => {
    const chosenFile = e.target.files[0];
    setFile(chosenFile);
    setUploadError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setUploadError("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Validation logic
  const validate = () => {
    const errs = {};
    if (!validateFy(fy)) errs.fy = true;
    if (!validateOrderType(orderType)) errs.orderType = true;
    if (!validateOrderNumber(orderNumber)) errs.orderNumber = true;
    if (!orderDate) errs.orderDate = true;
    if (!validateTitle(title)) errs.title = true;
    if (!validateFile(file)) errs.file = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setUploadError("");

    if (!validate()) {
      setUploadError("Please correct all highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Rename file
      const ext = file.name.split('.').pop();
      const safeOrderType = orderType.toUpperCase();
      const safeOrderNumber = orderNumber;
      const newFileName = `${safeOrderType}-${safeOrderNumber}.${ext}`;
      const uploadUrl = `${s3ApiUrl}/${newFileName}`;

      // 2. Upload file to S3 (PUT)
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
          "x-api-key": s3ApiKey
        }
      });

      // 3. POST order to DB
      await axios.post(API_URL, {
        classification: "UNCLASSIFIED", // Adjust as needed
        order_fy: fy.toUpperCase(),
        order_type: safeOrderType,
        order_number: safeOrderNumber,
        order_date: orderDate, // already YYYY-MM-DD
        order_title: capitalizeWords(title),
        order_location: uploadUrl
      }, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": dbApiKey
        }
      });

      setSuccessMsg("Order and file uploaded successfully!");
      resetForm();
    } catch (err) {
      setUploadError("Failed to upload. Please try again or contact support.");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-slate-800 p-6 rounded-xl shadow text-slate-100">
      <h1 className="text-2xl font-bold mb-6 text-center">Upload New Order</h1>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          {/* FY */}
          <div className="flex-1">
            <label className="block mb-1">
              FY{" "}
              {errors.fy && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={fy}
              onChange={e => setFy(e.target.value.toUpperCase().slice(0,4))}
              placeholder="FY25"
              className={`w-full px-3 py-2 rounded bg-slate-700 focus:outline-none ${errors.fy ? 'border border-red-500' : 'border border-transparent'}`}
              maxLength={4}
              pattern="[A-Za-z]{2}\d{2}"
            />
          </div>
          {/* Order Type */}
          <div className="flex-1">
            <label className="block mb-1">
              Order Type{" "}
              {errors.orderType && <span className="text-red-500">*</span>}
            </label>
            <select
              value={orderType}
              onChange={e => setOrderType(e.target.value)}
              className={`w-full px-3 py-2 rounded bg-slate-700 ${errors.orderType ? 'border border-red-500' : 'border border-transparent'}`}
            >
              {orderTypeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Order Number & Date */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block mb-1">
              Order Number{" "}
              {errors.orderNumber && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="25-001"
              className={`w-full px-3 py-2 rounded bg-slate-700 ${errors.orderNumber ? 'border border-red-500' : 'border border-transparent'}`}
              maxLength={6}
              pattern="\d{2}-\d{3}"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1">
              Order Date{" "}
              {errors.orderDate && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              className={`w-full px-3 py-2 rounded bg-slate-700 ${errors.orderDate ? 'border border-red-500' : 'border border-transparent'}`}
              pattern="\d{4}-\d{2}-\d{2}"
            />
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block mb-1">
            Title{" "}
            {errors.title && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(capitalizeWords(e.target.value))}
            placeholder="ENTER ORDER TITLE HERE..."
            className={`w-full px-3 py-2 rounded bg-slate-700 ${errors.title ? 'border border-red-500' : 'border border-transparent'}`}
          />
        </div>

        {/* File upload */}
        <div
          className={`mb-2 border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center cursor-pointer bg-slate-700 relative ${errors.file ? 'border-red-500' : 'border-slate-500'}`}
          onClick={() => fileInputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            accept=".pdf,.docx"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <UploadIcon className="mb-2 h-8 w-8 text-blue-400" />
          <p className="mb-1">{file ? file.name : "Select or drag-and-drop a PDF or DOCX file"}</p>
          <span className="text-xs text-slate-400">* Only .pdf or .docx files are accepted</span>
          {errors.file && <span className="text-red-500 text-xs absolute bottom-2">Required</span>}
        </div>

        {uploadError && <div className="text-red-400 mb-2">{uploadError}</div>}
        {successMsg && <div className="text-green-400 mb-2">{successMsg}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 transition py-2 rounded text-xl font-bold disabled:opacity-50"
        >
          {submitting ? "Uploading..." : "Upload Order"}
        </button>
      </form>
    </div>
  );
}
