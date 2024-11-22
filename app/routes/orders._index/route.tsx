import { useLoaderData, Link, Form } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const orders = await prisma.order.findMany({
    include: {
      client: true,
      restaurant: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ orders });
};

export default function OrdersIndex() {
  const { orders } = useLoaderData();
  const [filter, setFilter] = useState("ALL");

  // Filter orders by status
  const filteredOrders = orders.filter((order) =>
    filter === "ALL" ? true : order.status === filter
  );

  return (
    <div>
      <h1>Orders List</h1>

      {/* Navigation to Create New Order */}
      <div style={{ marginBottom: "20px" }}>
        <Link to="/orders/new">
          <button style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white" }}>
            Create New Order
          </button>
        </Link>
      </div>

      {/* Filter Orders by Status */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          Filter by Status:
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginLeft: "10px" }}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
      </div>

      {/* Orders Table */}
      <table border="1" style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Client</th>
            <th>Restaurant</th>
            <th>Created At</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link
                  to={`/orders/${order.id}`}
                  style={{ textDecoration: "underline", color: "blue" }}
                >
                  {order.id}
                </Link>
              </td>
              <td>
                {order.client.firstName} {order.client.lastName}
              </td>
              <td>{order.restaurant.name}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td
                style={{
                  color:
                    order.status === "PENDING"
                      ? "orange"
                      : order.status === "IN_PROGRESS"
                      ? "blue"
                      : "green",
                  fontWeight: "bold",
                }}
              >
                {order.status}
              </td>
              <td>
                {/* Status Update Form */}
                {order.status !== "COMPLETED" && (
                  <Form method="post" action={`/orders/${order.id}/status`}>
                    <select name="status" defaultValue={order.status}>
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
                    <button type="submit" style={{ marginLeft: "10px" }}>
                      Update
                    </button>
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
