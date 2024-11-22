import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-6xl font-bold text-blue-500 mb-4">
          RestaurantFlow
        </h1>
        <p className="text-gray-300 text-lg">
          Your streamlined solution for managing clients, restaurants, and orders.
        </p>
      </header>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clients */}
        <Link to="/clients" className="group">
          <div className="bg-gray-800 hover:bg-blue-600 transition rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-white">
              Clients
            </h2>
            <p className="text-gray-400 group-hover:text-gray-200">
              Manage your client database effortlessly.
            </p>
          </div>
        </Link>

        {/* Restaurants */}
        <Link to="/restaurants" className="group">
          <div className="bg-gray-800 hover:bg-green-600 transition rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-white">
              Restaurants
            </h2>
            <p className="text-gray-400 group-hover:text-gray-200">
              Keep track of your partner restaurants.
            </p>
          </div>
        </Link>

        {/* Orders */}
        <Link to="/orders" className="group">
          <div className="bg-gray-800 hover:bg-yellow-600 transition rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-white">
              Orders
            </h2>
            <p className="text-gray-400 group-hover:text-gray-200">
              Manage and review all your orders seamlessly.
            </p>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} RestaurantFlow. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
