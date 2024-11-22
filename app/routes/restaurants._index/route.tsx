import { Link, Form, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";

// Loader to fetch restaurants
export const loader: LoaderFunction = async () => {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });
  return json({ restaurants });
};

// Handle restaurant deletion
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const restaurantId = formData.get("id");

  if (typeof restaurantId !== "string") {
    return json({ errorMessage: "Invalid restaurant ID." }, { status: 400 });
  }

  try {
    await prisma.order.deleteMany({ where: { restaurantId } });
    await prisma.restaurant.delete({ where: { id: restaurantId } });

    return redirect("/restaurants?success=Restaurant deleted successfully.");
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return json(
      { errorMessage: "Could not delete the restaurant. Try again later." },
      { status: 500 }
    );
  }
};

// Component for restaurant list
export default function RestaurantsList() {
  const { restaurants } = useLoaderData();
  const navigation = useNavigation();

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-100 rounded-lg shadow-lg">
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Restaurants</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your restaurants. Add, edit, or delete as needed.
        </p>
      </header>

      {/* Table for restaurants */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse rounded-md shadow-md">
          <thead>
            <tr className="bg-gray-700 text-white text-sm font-semibold">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant, idx) => (
              <tr
                key={restaurant.id}
                className={`border-b ${
                  idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <td className="px-4 py-3 text-black">{restaurant.name}</td>
                <td className="px-4 py-3 text-black">
                  {restaurant.phone || "N/A"}
                </td>
                <td className="px-4 py-3 text-black">{restaurant.address}</td>
                <td className="px-4 py-3 flex space-x-2">
                  <Link to={`/restaurants/edit/${restaurant.id}`}>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                      Edit
                    </button>
                  </Link>
                  <Form
                    method="post"
                    onSubmit={(event) => {
                      if (
                        !confirm(
                          `Are you sure you want to delete "${restaurant.name}"? This action cannot be undone.`
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={restaurant.id} />
                    <button
                      type="submit"
                      disabled={
                        navigation.formData?.get("id") === restaurant.id &&
                        navigation.state === "submitting"
                      }
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
                        navigation.formData?.get("id") === restaurant.id &&
                        navigation.state === "submitting"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {navigation.formData?.get("id") === restaurant.id &&
                      navigation.state === "submitting"
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between">
        <Link to="/restaurants/new">
          <button className="px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-md shadow-md">
            Add New Restaurant
          </button>
        </Link>
        <Link to="/">
          <button className="px-6 py-3 text-white bg-gray-600 hover:bg-gray-700 rounded-md shadow-md">
            Back to Main Menu
          </button>
        </Link>
      </div>
    </div>
  );
}
