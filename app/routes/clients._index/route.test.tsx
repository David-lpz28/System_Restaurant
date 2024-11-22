import { render, screen } from "@testing-library/react";
import ClientsList from "./route";

describe("ClientsList Component", () => {
  test("renders the Client List heading", () => {
    render(<ClientsList />);
    const heading = screen.getByRole("heading", { name: /Client List/i });
    expect(heading).toBeInTheDocument();
  });

  test("renders the 'Create New Client' button", () => {
    render(<ClientsList />);
    const button = screen.getByRole("button", { name: /Create New Client/i });
    expect(button).toBeInTheDocument();
  });

  test("renders client data", async () => {
    const mockClients = [
      { id: "1", firstName: "John", lastName: "Doe", phone: "123456", address: "123 St" },
      { id: "2", firstName: "Jane", lastName: "Smith", phone: "789012", address: "456 Ave" },
    ];
    jest.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ clients: mockClients }),
    });

    render(<ClientsList />);
    const clientRows = await screen.findAllByRole("row");
    expect(clientRows).toHaveLength(mockClients.length + 1); // Header + clients
  });
});
