import { Link, Form, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";

// Define restaurant data type
type Restaurant = {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
};

// Define loader data type
type LoaderData = {
  restaurants: Restaurant[];
  successMessage?: string;
  errorMessage?: string;
};

// Loader to fetch restaurants
export const loader: LoaderFunction = async () => {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });
  return json<LoaderData>({ restaurants });
};

// Action to handle restaurant deletion
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const restaurantId = formData.get("id");

  if (typeof restaurantId !== "string") {
    return json({ errorMessage: "Invalid restaurant ID." }, { status: 400 });
  }

  try {
    // Cascade delete: delete associated orders first, then the restaurant
    await prisma.order.deleteMany({
      where: { restaurantId },
    });
    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    return redirect("/restaurants?success=Restaurant deleted successfully.");
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return json(
      { errorMessage: "Could not delete the restaurant. Try again later." },
      { status: 500 }
    );
  }
};

export default function RestaurantsList() {
  const { restaurants, successMessage, errorMessage } =
    useLoaderData<LoaderData>();
  const navigation = useNavigation();

  return (
    <div>
      <h1>Restaurants</h1>
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone Number</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map((restaurant) => {
            const isDeleting =
              navigation.formData?.get("id") === restaurant.id &&
              navigation.state === "submitting";

            return (
              <tr key={restaurant.id}>
                <td>{restaurant.name}</td>
                <td>{restaurant.phoneNumber}</td>
                <td>{restaurant.address}</td>
                <td>
                  <Link to={`/restaurants/edit/${restaurant.id}`}>
                    <button>Edit</button>
                  </Link>
                  <Form
                    method="post"
                    onSubmit={(event) => {
                      if (
                        !confirm(
                          `Are you sure you want to delete the restaurant "${restaurant.name}"? This action cannot be undone.`
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                    style={{ display: "inline-block", marginLeft: "10px" }}
                  >
                    <input type="hidden" name="id" value={restaurant.id} />
                    <button type="submit" disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </Form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Link to="/restaurants/new">
        <button style={{ marginTop: "20px" }}>Add New Restaurant</button>
      </Link>
    </div>
  );
}
