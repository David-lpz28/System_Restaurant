import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

// Define the order data type
type Order = {
  id: string;
  createdAt: string;
  restaurantName: string;
};

// Define loader data type
type LoaderData = {
  orders: Order[];
};

// Loader to fetch orders
export const loader: LoaderFunction = async () => {
  const orders = await prisma.order.findMany({
    include: {
      restaurant: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map the orders to include only the necessary fields
  const mappedOrders = orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    restaurantName: order.restaurant.name,
  }));

  return json<LoaderData>({ orders: mappedOrders });
};

export default function OrdersList() {
  const { orders } = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>Orders</h1>
      <Link to="/orders/new">
        <button style={{ marginBottom: "20px" }}>Create New Order</button>
      </Link>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Restaurant</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.restaurantName}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
