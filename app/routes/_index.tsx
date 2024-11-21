import { Link } from '@remix-run/react';

export default function Index() {
  return (
    <div>
      <h1>Bienvenido a la Aplicación de Clientes</h1>
      <Link to="/clients">
        <button>Ir a la Lista de Clientes</button>
      </Link>
    </div>
  );
}

// Error Boundary para manejar errores en esta ruta
import { useRouteError, isRouteErrorResponse } from '@remix-run/react';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>Error {error.status}</h1>
        <p>{error.statusText}</p>
        {error.data && <pre>{JSON.stringify(error.data, null, 2)}</pre>}
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Ocurrió un error inesperado</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre>{error.stack}</pre>
        )}
      </div>
    );
  } else {
    return <h1>Error desconocido</h1>;
  }
}
