import { useLoaderData, Form, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const success = url.searchParams.get("success");

  const orders = await prisma.order.findMany({
    include: {
      client: true,
      restaurant: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ orders, success });
};

export default function OrdersIndex() {
  const { orders, success } = useLoaderData();
  const [filter, setFilter] = useState("ALL");

  // Filter orders by status
  const filteredOrders = orders.filter((order) =>
    filter === "ALL" ? true : order.status === filter
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders List</h1>
        <div className="flex space-x-4">
          <Link to="/">
            <button className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700">
              Back to Home
            </button>
          </Link>
          <Link to="/orders/new">
            <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Create New Order
            </button>
          </Link>
        </div>
      </header>

      {/* Success Message */}
      {success && (
        <p className="text-green-600 font-semibold mb-4">
          Order status updated successfully!
        </p>
      )}

      {/* Filter Orders by Status */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Filter by Status:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Orders Table */}
      <table className="w-full border-collapse border border-gray-200 rounded-lg shadow-sm bg-white">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="px-4 py-2 text-left">Order ID</th>
            <th className="px-4 py-2 text-left">Client</th>
            <th className="px-4 py-2 text-left">Restaurant</th>
            <th className="px-4 py-2 text-left">Created At</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="text-black">
          {filteredOrders.map((order) => (
            <tr
              key={order.id}
              className="border-t border-gray-200 hover:bg-gray-50"
            >
              {/* Link to Order Details */}
              <td className="px-4 py-2 font-medium text-blue-600 hover:underline">
                <Link to={`/orders/${order.id}`}>{order.id}</Link>
              </td>
              <td className="px-4 py-2">
                {order.client.firstName} {order.client.lastName}
              </td>
              <td className="px-4 py-2">{order.restaurant.name}</td>
              <td className="px-4 py-2">
                {new Date(order.createdAt).toLocaleString()}
              </td>

              {/* Display order status with color */}
              <td
                className={`px-4 py-2 font-semibold ${
                  order.status === "PENDING"
                    ? "text-yellow-500"
                    : order.status === "IN_PROGRESS"
                    ? "text-blue-500"
                    : "text-green-500"
                }`}
              >
                {order.status}
              </td>

              {/* Status Update Controls */}
              <td className="px-4 py-2">
                {order.status !== "COMPLETED" && (
                  <Form method="post" action={`/orders/${order.id}/status`}>
                    <div className="flex items-center space-x-2">
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                      >
                        {order.status === "PENDING" && (
                          <>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </>
                        )}
                        {order.status === "IN_PROGRESS" && (
                          <option value="COMPLETED">Completed</option>
                        )}
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Update
                      </button>
                    </div>
                  </Form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
