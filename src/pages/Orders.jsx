import { useEffect, useState } from "react";
import axios from "axios";
import { Download, ArrowLeft, ArrowRight } from "lucide-react";

const API_URL = import.meta.env.VITE_DB_API_URL;
const dbApiKey = import.meta.env.VITE_DB_API_KEY;
const s3ApiKey = import.meta.env.VITE_S3_API_KEY;

const PAGE_SIZE = 50;


export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios.get(API_URL, {
      headers: {
        "x-api-key": dbApiKey,
      },
      params: {
        limit: PAGE_SIZE,
        offset: offset,
      },
    })
      .then(res => {
        setOrders(res.data.orders); 
        setTotal(res.data.total);   
      })
      .catch(() => setError("Could not fetch orders."))
      .finally(() => setLoading(false));
  }, [offset]);

  const handleDownload = async (url) => {
  try {
    console.log('Starting download for URL:', url);
    
    const response = await axios.get(url, {
      headers: { "x-api-key": s3ApiKey },
      responseType: "blob",
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Content type:', response.headers['content-type']);

    // Check if we're getting Base64-encoded data (even if content-type says JSON)
    if (response.headers['content-type'] === 'application/json') {
      // Convert blob back to text to get the Base64 string
      const base64Text = await response.data.text();
      console.log('Base64 data length:', base64Text.length);
      
      // Check if it looks like Base64 (starts with common PDF Base64 patterns)
      if (base64Text.startsWith('JVBERi0x') || base64Text.startsWith('JVBER')) {
        console.log('Detected Base64-encoded PDF data');
        
        // Convert Base64 to binary
        const binaryString = atob(base64Text);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Get filename from URL
        let filename = url.split("/").pop();
        if (!filename.includes('.')) {
          filename += '.pdf'; // Add extension if missing
        }
        
        // Create blob with correct PDF content type
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        
        console.log('Base64 PDF download completed successfully');
        return;
      } else {
        // Try to parse as JSON if it's not Base64
        try {
          const jsonData = JSON.parse(base64Text);
          console.log('Parsed JSON:', jsonData);
          
          // Check if there's a download URL in the response
          if (jsonData.downloadUrl || jsonData.url || jsonData.signedUrl) {
            const actualUrl = jsonData.downloadUrl || jsonData.url || jsonData.signedUrl;
            console.log('Found actual download URL:', actualUrl);
            return handleActualFileDownload(actualUrl);
          }
        } catch (parseError) {
          console.error('Not valid JSON either:', parseError);
        }
      }
      
      alert("Server returned unexpected data format. Check console for details.");
      return;
    }

    // Handle direct file download (if server returns actual file with correct content-type)
    console.log('Response data type:', typeof response.data);
    console.log('Response data size:', response.data.size);
    console.log('Is blob?', response.data instanceof Blob);

    if (response.data.size === 0) {
      console.error('Received empty blob');
      alert("Received empty file. Check server response.");
      return;
    }

    // Try to get the filename from the URL or Content-Disposition header
    let filename = url.split("/").pop();
    const disposition = response.headers["content-disposition"];
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }

    console.log('Filename:', filename);

    // Use the actual content type from the response
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    console.log('Content type:', contentType);
    
    // Create blob with the correct content type
    const blob = new Blob([response.data], { type: contentType });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

  } catch (error) {
    console.error('Download error:', error);
    console.error('Error response:', error.response);
    alert("Failed to download file.");
  }
};

// Keep the handleActualFileDownload function as backup
const handleActualFileDownload = async (url) => {
  try {
    console.log('Downloading actual file from:', url);
    
    const response = await axios.get(url, {
      responseType: "blob",
    });

    console.log('Actual file response status:', response.status);
    console.log('Actual file content type:', response.headers['content-type']);
    console.log('Actual file size:', response.data.size);

    if (response.data.size === 0) {
      console.error('Received empty file');
      alert("Received empty file.");
      return;
    }

    let filename = url.split("/").pop().split("?")[0];
    const disposition = response.headers["content-disposition"];
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }

    const contentType = response.headers['content-type'] || 'application/pdf';
    
    const blob = new Blob([bytes], { type: contentType });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    console.log('File download completed successfully');

  } catch (error) {
    console.error('Actual download error:', error);
    alert("Failed to download actual file.");
  }
};


  const handleNext = () => setOffset(offset + PAGE_SIZE);
  const handlePrev = () => setOffset(Math.max(0, offset - PAGE_SIZE));
  const start = total === 0 ? 0 : offset + 1;
  const end = offset + orders.length;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-slate-100 text-center">
        Viewing {start} - {end} of {total}
      </h1>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {loading ? (
        <div className="text-slate-300">Loading orders...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl shadow w-full">
            <table className="min-w-full bg-slate-800 rounded-xl">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-3 px-4 text-center">FY</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Number</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Classification</th>
                  <th className="py-3 px-4 text-center min-w-[250px]">Title</th>
                  <th className="py-3 px-4 text-center">Download</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={idx % 2 === 0 ? "bg-slate-700" : "bg-slate-600"}
                  >
                    <td className="py-2 px-4">{order.order_fy}</td>
                    <td className="py-2 px-4">{order.order_type}</td>
                    <td className="py-2 px-4">{order.order_number}</td>
                    <td className="py-2 px-4 whitespace-nowrap">{order.order_date}</td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">{order.classification}</td>
                    <td className="py-2 px-4 min-w-[250px]">{order.order_title}</td>
                    <td className="py-2 px-4 flex justify-center">
                      <button
                        onClick={() => handleDownload(order.order_location)}
                        className="p-2 rounded-full hover:bg-slate-500 transition"
                        title="Download Order"
                      >
                        <Download className="h-5 w-5 text-blue-300" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex gap-4 mt-4">
            {offset > 0 && (
              <button
                onClick={handlePrev}
                className="p-2 rounded hover:bg-slate-700 transition"
                aria-label="Previous page"
              >
                <ArrowLeft size={28} />
              </button>
            )}
            {offset + PAGE_SIZE < total && (
              <button
                onClick={handleNext}
                className="p-2 rounded hover:bg-slate-700 transition"
                aria-label="Next page"
              >
                <ArrowRight size={28} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
