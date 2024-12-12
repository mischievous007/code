// Import the fetch API from Backstage
import { fetchApiRef, useApi } from "@backstage/core-plugin-api";
import { openFgaConfig } from "./openFgaConfig";

interface OpenFgaRequest {
  tuple_key: { user: string; relation: string; object: string };
  authorization_model_id: string;
}

interface OpenFgaResponse {
  allowed: boolean;
  ok?: boolean;
  message: string;
}

let permissionResponse: OpenFgaResponse | null = null;

export function getPermissionResponse(): OpenFgaResponse | null {
  return permissionResponse;
}

const openFgaBaseUrl = openFgaConfig.baseUrl;
const openFgaStoreId = openFgaConfig.storeId;
const authorizationModelId = openFgaConfig.authorizationModelId;

// Function to use the fetch API provided by Backstage
export async function sendPermissionRequest(
  entityName: string,
  action: string,
  userName: any,
  fetch: typeof window.fetch
): Promise<OpenFgaResponse> {
  const url = `${openFgaBaseUrl}/stores/${openFgaStoreId}/check`;

  const relation =
    action.toLowerCase() === "delete"
      ? "catalog_entity_delete"
      : "catalog_entity_read";

  const requestBody: OpenFgaRequest = {
    tuple_key: {
      user: `${userName}`,
      relation,
      object: `catalog_entity:${entityName}`,
    },
    authorization_model_id: authorizationModelId,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenFGA API call failed with status: ${response.status}`);
  }

  const data = (await response.json()) as OpenFgaResponse;
  permissionResponse = data;
  return data;
}

export async function addPolicy(
  entityName: string,
  accessType: string,
  userName: any,
  fetch: typeof window.fetch
): Promise<OpenFgaResponse> {
  const url = `${openFgaBaseUrl}/stores/${openFgaStoreId}/write`;

  const requestBody = {
    writes: {
      tuple_keys: [
        {
          _description: `Add ${userName} as ${accessType} on catalog_entity:${entityName}`,
          user: `${userName}`,
          relation: accessType,
          object: `catalog_entity:${entityName}`,
        },
      ],
    },
    authorization_model_id: authorizationModelId,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json()) as OpenFgaResponse;
  return data;
}

export async function revokePolicy(
  entityName: string,
  accessType: string,
  userName: any,
  fetch: typeof window.fetch
): Promise<OpenFgaResponse> {
  const url = `${openFgaBaseUrl}/stores/${openFgaStoreId}/write`;

  const requestBody = {
    deletes: {
      tuple_keys: [
        {
          _description: `Revoke ${userName} as ${accessType} on catalog_entity:${entityName}`,
          user: `${userName}`,
          relation: accessType,
          object: `catalog_entity:${entityName}`,
        },
      ],
    },
    authorization_model_id: authorizationModelId,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json()) as OpenFgaResponse;
  return data;
}

// Example usage within a React functional component
// Note: Adjust the usage based on your component's structure
export function MyComponent() {
  const fetch = useApi(fetchApiRef); // Fetch API from Backstage

  async function handlePermissionCheck() {
    try {
      const response = await sendPermissionRequest(
        "entityName",
        "read",
        "userName",
        fetch
      );
      console.log(response);
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  }

  return <button onClick={handlePermissionCheck}>Check Permissions</button>;
}
