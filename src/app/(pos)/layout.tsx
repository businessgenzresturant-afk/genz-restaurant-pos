import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gen-Z Restaurant POS",
  description: "Restaurant Point of Sale System",
};

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-primary">RagsPOS</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="/pos/tables" className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">Tables</a>
                  <a href="/pos/menu" className="text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">Menu</a>
                  <a href="/pos/orders" className="text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">Orders</a>
                  <a href="/pos/bills" className="text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">Bills</a>
                  <a href="/pos/reports" className="text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">Reports</a>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <button type="button" className="bg-white rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  User
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex flex-col min-h-[calc(100vh-16rem)]">
        <div className="overflow-y-auto flex-1 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}