import { Link, Form, useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useState } from "react";

// Loader to fetch restaurants
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "name";

  const restaurants = await prisma.restaurant.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { [sort]: "asc" },
  });

  return json({ restaurants });
};

// Action to handle restaurant deletion
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const restaurantId = formData.get("id");

  if (typeof restaurantId !== "string" || !restaurantId) {
    return json({ error: "Invalid restaurant ID." }, { status: 400 });
  }

  try {
    // Delete associated orders and items before deleting the restaurant
    const orders = await prisma.order.findMany({ where: { restaurantId } });
    for (const order of orders) {
      await prisma.item.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
    }

    await prisma.restaurant.delete({ where: { id: restaurantId } });

    return redirect("/restaurants?success=Restaurant and associated orders deleted successfully.");
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return json({ error: "Failed to delete the restaurant." }, { status: 500 });
  }
};

// Component for Restaurants List
export default function RestaurantsList() {
  const { restaurants } = useLoaderData();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (sort) params.append("sort", sort);
    window.location.search = params.toString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Restaurant Management</h1>

        {/* Navigation */}
        <div className="mb-6 flex justify-between">
          <Link to="/">
            <button className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
              Back to Home
            </button>
          </Link>
          <Link to="/restaurants/new">
            <button className="px-4 py-2 bg-green-600 text-gray-200 rounded hover:bg-green-500">
              Add New Restaurant
            </button>
          </Link>
        </div>

        {/* Search and Sorting */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 w-full bg-gray-800 text-gray-200 rounded"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-gray-200 rounded"
          >
            <option value="name">Sort by Name</option>
            <option value="address">Sort by Address</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-gray-200 rounded hover:bg-blue-500">
            Search
          </button>
        </form>

        {/* Restaurants Table */}
        <div className="overflow-x-auto bg-gray-800 rounded shadow-md">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-700 text-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Address</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant, index) => (
                <tr
                  key={restaurant.id}
                  className={index % 2 === 0 ? "bg-gray-700" : "bg-gray-800"}
                >
                  <td className="px-6 py-4">{restaurant.name}</td>
                  <td className="px-6 py-4">{restaurant.phone || "N/A"}</td>
                  <td className="px-6 py-4">{restaurant.address}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <Link
                      to={`/restaurants/edit/${restaurant.id}`}
                      className="px-3 py-1 bg-blue-500 text-gray-900 rounded hover:bg-blue-400"
                    >
                      Edit
                    </Link>
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (
                          !confirm(
                            `Are you sure you want to delete "${restaurant.name}"? This will also delete all associated orders.`
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={restaurant.id} />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-red-500 text-gray-900 rounded hover:bg-red-400"
                      >
                        Delete
                      </button>
                    </Form>
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
