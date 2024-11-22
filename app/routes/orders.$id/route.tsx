import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { prisma } from "~/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) {
    throw new Response("Order ID is required", { status: 400 });
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
  const { order } = useLoaderData();

  const totalPrice = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <div>
      <h1>Order Details</h1>
      <Link to="/orders" style={{ display: "block", marginBottom: "20px" }}>
        Back to Orders List
      </Link>

      <div>
        <h2>Order Information</h2>
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        {order.completedAt && (
          <p>
            <strong>Completed At:</strong>{" "}
            {new Date(order.completedAt).toLocaleString()}
          </p>
        )}
        <p>
          <strong>Status:</strong>{" "}
          <span
            style={{
              color:
                order.status === "PENDING"
                  ? "orange"
                  : order.status === "IN_PROGRESS"
                  ? "blue"
                  : "green",
            }}
          >
            {order.status}
          </span>
        </p>
      </div>

      <div>
        <h2>Client Information</h2>
        <p>
          <strong>Name:</strong> {order.client.firstName}{" "}
          {order.client.lastName}
        </p>
        <p><strong>Phone:</strong> {order.client.phone}</p>
        <p><strong>Address:</strong> {order.client.address}</p>
      </div>

      <div>
        <h2>Restaurant Information</h2>
        <p><strong>Name:</strong> {order.restaurant.name}</p>
        <p><strong>Phone:</strong> {order.restaurant.phone}</p>
        <p><strong>Address:</strong> {order.restaurant.address}</p>
      </div>

      <div>
        <h2>Order Items</h2>
        <table border="1" style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Quantity</th>
              <th>Description</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.quantity}</td>
                <td>{item.description}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" style={{ textAlign: "right" }}>
                Total:
              </td>
              <td>${totalPrice.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
