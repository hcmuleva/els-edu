// Create and Update operations for Strapi data provider
import { apiUrl } from "./httpClient";

/**
 * Create a new resource
 * Handles both JSON and FormData formats
 */
export const createResource = async (httpClient, resource, params) => {
  // Check if this is FormData (for file uploads)
  const isFormData = params.meta && params.meta.isFormData;

  if (isFormData) {
    // For FormData, we need to use fetch directly, not fetchJson
    // fetchJson adds Content-Type: application/json which breaks FormData
    const token = localStorage.getItem("token");
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // DO NOT set Content-Type - let browser set it with boundary for multipart/form-data

    const response = await fetch(`${apiUrl}/${resource}`, {
      method: "POST",
      headers,
      body: params.data, // FormData object
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Request failed");
    }

    const json = await response.json();
    const data = json.data || json;
    return { data: { ...data, id: data.id } };
  }

  // Regular JSON handling
  const isUsersResource = resource === "users";
  const body = isUsersResource
    ? JSON.stringify(params.data)
    : JSON.stringify({ data: params.data });

  const { json } = await httpClient(`${apiUrl}/${resource}`, {
    method: "POST",
    body,
  });

  const data = json.data || json;
  return { data: { ...data, id: data.id } };
};

/**
 * Update an existing resource
 * Handles both JSON and FormData formats
 */
export const updateResource = async (httpClient, resource, params) => {
  // Check if this is FormData (for file uploads)
  const isFormData = params.meta && params.meta.isFormData;

  if (isFormData) {
    // For FormData, use fetch directly
    const token = localStorage.getItem("token");
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${apiUrl}/${resource}/${params.id}`, {
      method: "PUT",
      headers,
      body: params.data, // FormData object
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Request failed");
    }

    const json = await response.json();
    const data = json.data || json;
    return { data: { ...data, id: data.id } };
  }

  // Regular JSON handling
  const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
    method: "PUT",
    body: JSON.stringify({ data: params.data }),
  });
  const data = json.data || json;
  return { data: { ...data, id: data.id } };
};

/**
 * Delete a resource
 */
export const deleteResource = async (httpClient, resource, params) => {
  const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
    method: "DELETE",
  });
  const data = json.data || json;
  return { data: { ...data, id: data.id } };
};
