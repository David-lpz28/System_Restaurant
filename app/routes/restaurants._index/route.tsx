import { LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

// Loader to fetch the list of restaurants
export const loader: LoaderFunction = async () => {
  const restaurants = await prisma.restaurant.findMany();
  return json({ restaurants });
};

export default function RestaurantsIndex() {
  const { restaurants } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Restaurant List</h1>
      <ul>
        {restaurants.map((restaurant) => (
          <li key={restaurant.id}>
            {restaurant.name} - {restaurant.location}
            <Link
              to={`/restaurants/edit/${restaurant.id}`}
              style={{ marginLeft: "10px" }}
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/restaurants/new">
        <button style={{ marginTop: "10px" }}>Add New Restaurant</button>
      </Link>
    </div>
  );
}
