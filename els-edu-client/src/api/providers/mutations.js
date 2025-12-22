// Create and Update operations for Strapi data provider
import { apiUrl } from "./httpClient";

/**
 * Recursively strips system fields from the payload
 */
const sanitizePayload = (data) => {
  if (Array.isArray(data)) {
    return data.map(sanitizePayload);
  }
  if (data !== null && typeof data === "object") {
    // Check if it's a File object (don't sanitize) or Date
    if (data instanceof Date) return data;

    const {
      documentId,
      createdAt,
      updatedAt,
      publishedAt,
      createdBy,
      updatedBy,
      locale,
      localizations,
      ...rest
    } = data;

    // Recursively sanitize all remaining properties
    const sanitized = {};
    for (const key in rest) {
      sanitized[key] = sanitizePayload(rest[key]);
    }
    return sanitized;
  }
  return data;
};

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
  const sanitizedData = sanitizePayload(params.data);
  const body = isUsersResource
    ? JSON.stringify(sanitizedData)
    : JSON.stringify({ data: sanitizedData });

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
  // Recursively strip read-only fields
  const cleanData = sanitizePayload(params.data);

  const isUsersResource = resource === "users";
  const body = isUsersResource
    ? JSON.stringify(cleanData)
    : JSON.stringify({ data: cleanData });

  const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
    method: "PUT",
    body,
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
