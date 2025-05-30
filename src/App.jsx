import { useState } from "react";
import Orders from "./pages/Orders";
import Search from "./pages/Search";
import Upload from "./pages/Upload";


function App() {
  // Tab state: "orders", "search", "upload"
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="min-h-screen bg-slate-800 text-slate-200 flex flex-col">
      {/* Header with logos */}
      <header className="w-full py-6 px-6 flex items-center justify-between bg-slate-900">
  <div className="flex-1 flex justify-start">
    <img
      src="/src/assets/idsg-logo.png"
      alt="IDSG Logo"
      className="h-16 w-auto max-w-[180px] object-contain"
    />
  </div>
  <div className="flex-1 flex justify-center">
    <img
      src="/src/assets/ordhub-logo.png"
      alt="ORDHub Logo"
      className="h-20 w-auto max-w-[220px] object-contain"
    />
  </div>
  <div className="flex-1 flex justify-end">
    <img
      src="/src/assets/innovation-logo.png"
      alt="Innovation Logo"
      className="h-16 w-auto max-w-[180px] object-contain"
    />
  </div>
</header>

      {/* Separator */}
      <div className="border-b border-slate-600 w-full" />

      {/* Tabs */}
      <nav className="flex justify-center bg-slate-800">
        {[
          { key: "orders", label: "Orders" },
          { key: "search", label: "Search" },
          { key: "upload", label: "Upload" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-6 py-3 font-medium text-base transition border-b-2 ${
              activeTab === tab.key
                ? "border-blue-400 text-blue-300"
                : "border-transparent text-slate-300 hover:text-blue-200"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {activeTab === "orders" && (
          <Orders />
        )}
        {activeTab === "search" && (
          <Search />
        )}
        {activeTab === "upload" && (
          <Upload />
        )}
      </main>
    </div>
  );
}

export default App;
