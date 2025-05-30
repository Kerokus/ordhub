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

  const handleDownload = (url) => {
    window.open(url, "_blank");
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
                  <th className="py-3 px-4 text-left">FY</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Number</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Title</th>
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
                    <td className="py-2 px-4">
                      {order.order_date ? new Date(order.order_date).toLocaleDateString() : ""}
                    </td>
                    <td className="py-2 px-4">{order.order_title}</td>
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
