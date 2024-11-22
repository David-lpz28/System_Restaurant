import { useLoaderData, Link, Form } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useState } from "react";

// Loader to fetch orders
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const statusFilter = url.searchParams.get("status") || "ALL";

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        statusFilter !== "ALL"
          ? { status: statusFilter }
          : {},
        {
          OR: [
            { client: { firstName: { contains: search, mode: "insensitive" } } },
            { client: { lastName: { contains: search, mode: "insensitive" } } },
            { restaurant: { name: { contains: search, mode: "insensitive" } } },
          ],
        },
      ],
    },
    include: {
      client: true,
      restaurant: true,
    },
    orderBy: { [sortBy]: "desc" },
  });

  return json({ orders, search, sortBy, statusFilter });
};

// Action to handle order deletion
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const orderId = formData.get("orderId");

  if (typeof orderId !== "string" || !orderId) {
    return json({ error: "Invalid order ID." }, { status: 400 });
  }

  try {
    // Delete associated items first, then the order
    await prisma.item.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    return redirect("/orders");
  } catch (error) {
    console.error("Error deleting order:", error);
    return json({ error: "Failed to delete the order." }, { status: 500 });
  }
};

export default function OrdersList() {
  const { orders, search, sortBy, statusFilter } = useLoaderData();
  const [query, setQuery] = useState(search);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          Order Management
        </h1>

        {/* Back to Home */}
        <Link to="/">
          <button className="mb-4 px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
            Back to Home
          </button>
        </Link>

        {/* Search, Filters, and Sorting */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <Form className="flex-grow flex items-center gap-4" method="get">
            <input
              type="text"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client or restaurant"
              className="flex-grow px-4 py-2 bg-gray-800 text-gray-200 border border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-500"
            />
            <select
              name="status"
              defaultValue={statusFilter}
              className="px-4 py-2 bg-gray-800 text-gray-200 border border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              name="sortBy"
              defaultValue={sortBy}
              className="px-4 py-2 bg-gray-800 text-gray-200 border border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-gray-200 rounded hover:bg-blue-500 focus:ring focus:ring-blue-400"
            >
              Filter
            </button>
          </Form>

          {/* Add New Order */}
          <Link to="/orders/new">
            <button className="px-4 py-2 bg-green-600 text-gray-200 rounded hover:bg-green-500 focus:ring focus:ring-green-400">
              Add New Order
            </button>
          </Link>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto bg-gray-800 rounded shadow-md">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-700 text-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Client</th>
                <th className="px-6 py-3 text-left">Restaurant</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Created At</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className={index % 2 === 0 ? "bg-gray-700" : "bg-gray-800"}
                >
                  <td className="px-6 py-4">
                    <Link to={`/orders/${order.id}`} className="text-blue-500 hover:underline">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {order.client.firstName} {order.client.lastName}
                  </td>
                  <td className="px-6 py-4">{order.restaurant.name}</td>
                  <td
                    className={`px-6 py-4 font-bold ${
                      order.status === "PENDING"
                        ? "text-yellow-400"
                        : order.status === "IN_PROGRESS"
                        ? "text-blue-400"
                        : "text-green-400"
                    }`}
                  >
                    {order.status}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {order.status !== "COMPLETED" ? (
                      <Form method="post" action={`/orders/${order.id}/status`}>
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="px-3 py-1 bg-gray-800 text-gray-200 border border-gray-600 rounded"
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
                          className="px-3 py-1 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-400"
                        >
                          Update
                        </button>
                      </Form>
                    ) : (
                      <Form method="post">
                        <input type="hidden" name="orderId" value={order.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 bg-red-500 text-gray-900 rounded hover:bg-red-400"
                        >
                          Delete
                        </button>
                      </Form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
