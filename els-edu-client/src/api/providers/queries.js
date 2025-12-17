// Read operations for Strapi data provider
import queryString from "query-string";
import { apiUrl } from "./httpClient";
import {
  buildFilters,
  buildPopulate,
  buildSortAndPagination,
} from "./queryBuilder";

/**
 * Get a list of resources with pagination
 */
export const getList = async (httpClient, resource, params) => {
  const query = buildSortAndPagination(params);
  Object.assign(query, buildPopulate(resource, params.meta));
  Object.assign(query, buildFilters(resource, params.filter));

  const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
  const { headers, json } = await httpClient(url);

  // Handle response format (Array vs { data: [...] })
  const rawData = Array.isArray(json) ? json : json.data || [];

  // Map data to React Admin format
  const data = rawData.map((item) => {
    const normalized = {
      ...item,
      id: item.id, // Primary key
    };

    // Normalize topic and subject for questions - ensure ID is accessible
    if (resource === "questions") {
      if (item.topic && typeof item.topic === "object") {
        normalized.topic = item.topic;
      } else if (item.topic) {
        normalized.topic = item.topic;
      }

      if (item.subject && typeof item.subject === "object") {
        normalized.subject = item.subject;
      } else if (item.subject) {
        normalized.subject = item.subject;
      }
    }

    return normalized;
  });

  // Total Count Calculation
  let total = parseInt(headers.get("x-total-count"), 10);

  if (isNaN(total) && headers.get("content-range")) {
    total = parseInt(headers.get("content-range").split("/").pop(), 10);
  }

  if (isNaN(total) && json.meta && json.meta.pagination) {
    total = json.meta.pagination.total;
  }

  if (isNaN(total)) {
    const { page = 1, perPage = 20 } = params.pagination || {};
    total =
      data.length >= perPage
        ? page * perPage + 1
        : (page - 1) * perPage + data.length;
  }

  return {
    data,
    total,
  };
};

/**
 * Get a single resource by ID
 */
export const getOne = async (httpClient, resource, params) => {
  const query = {};

  Object.assign(query, buildPopulate(resource, params.meta));

  // Default population for specific resources if not provided
  if (!params.meta?.populate) {
    if (resource === "questions" || resource === "quizzes") {
      query["populate"] = "*";
    }
  }

  // Try documentId filter first
  query["filters[documentId][$eq]"] = params.id;
  const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;

  const { json } = await httpClient(url);

  const rawData = Array.isArray(json) ? json : json.data || [];
  if (rawData.length === 0) {
    // Fallback to numeric id
    delete query["filters[documentId][$eq]"];
    query["filters[id][$eq]"] = params.id;
    const fallbackUrl = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
    const { json: fallbackJson } = await httpClient(fallbackUrl);
    const fallbackData = Array.isArray(fallbackJson)
      ? fallbackJson
      : fallbackJson.data || [];

    if (fallbackData.length === 0) {
      throw new Error(`${resource} with id ${params.id} not found`);
    }
    return { data: { ...fallbackData[0], id: fallbackData[0].id } };
  }

  return { data: { ...rawData[0], id: rawData[0].id } };
};

/**
 * Get multiple resources by IDs
 */
export const getMany = async (httpClient, resource, params) => {
  const query = {
    [`filters[id][$in]`]: params.ids,
  };
  const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
  const { json } = await httpClient(url);
  const rawData = Array.isArray(json) ? json : json.data || [];
  return { data: rawData };
};

/**
 * Get many resources by reference
 */
export const getManyReference = async (httpClient, resource, params) => {
  // Placeholder - similar to getList but scoped to a target
  return { data: [], total: 0 };
};
