import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

// Loader to fetch order details
export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;

  if (!id) {
    throw new Response("Order ID not provided", { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      restaurant: true,
      items: true,
    },
  });

  if (!order) {
    throw new Response("Order not found", { status: 404 });
  }

  return json({ order });
};

export default function OrderDetails() {
  const { order } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-200 bg-gray-900 min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white border-b-2 border-gray-700 pb-2">
          Order Details
        </h1>
      </header>

      {/* General Information */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">General Information</h2>
        <ul className="bg-gray-800 shadow-lg rounded-lg p-4 space-y-3">
          <li>
            <span className="font-semibold text-white">Order ID:</span> {order.id}
          </li>
          <li>
            <span className="font-semibold text-white">Client:</span> {order.client.firstName}{" "}
            {order.client.lastName}
          </li>
          <li>
            <span className="font-semibold text-white">Restaurant:</span> {order.restaurant.name}
          </li>
          <li>
            <span className="font-semibold text-white">Created At:</span>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </li>
          {order.status === "COMPLETED" && (
            <li>
              <span className="font-semibold text-white">Completed At:</span>{" "}
              {order.completedAt ? new Date(order.completedAt).toLocaleString() : "N/A"}
            </li>
          )}
          <li>
            <span className="font-semibold text-white">Status:</span>{" "}
            <span
              className={`font-semibold px-2 py-1 rounded ${
                order.status === "PENDING"
                  ? "text-yellow-400 bg-yellow-900"
                  : order.status === "IN_PROGRESS"
                  ? "text-blue-400 bg-blue-900"
                  : "text-green-400 bg-green-900"
              }`}
            >
              {order.status}
            </span>
          </li>
        </ul>
      </div>

      {/* Order Items */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">Order Items</h2>
        <table className="w-full bg-gray-800 text-gray-200 shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Unit Price</th>
              <th className="px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr
                key={index}
                className="border-t border-gray-600 hover:bg-gray-700 transition"
              >
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-2 font-semibold">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <Link to="/orders">
          <button className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700">
            Back to Orders
          </button>
        </Link>
        <Link to="/">
          <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}

// Error Boundary for this route
import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-8 text-center text-white bg-gray-900">
        <h1 className="text-2xl font-bold text-red-500">Error {error.status}</h1>
        <p className="text-gray-300">{error.statusText}</p>
        {error.data && <pre className="text-left mt-4">{JSON.stringify(error.data, null, 2)}</pre>}
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div className="p-8 text-center text-white bg-gray-900">
        <h1 className="text-2xl font-bold text-red-500">Unexpected Error</h1>
        <p className="text-gray-300">{error.message}</p>
        {process.env.NODE_ENV === "development" && <pre className="mt-4">{error.stack}</pre>}
      </div>
    );
  } else {
    return (
      <div className="p-8 text-center text-white bg-gray-900">
        <h1 className="text-2xl font-bold text-red-500">Unknown Error</h1>
      </div>
    );
  }
}
