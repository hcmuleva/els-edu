import { fetchUtils } from "react-admin";
import queryString from "query-string";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

// Custom HTTP client that adds JWT to all requests
const httpClient = (url, options = {}) => {
  const token = localStorage.getItem("token");
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  if (token) {
    options.headers.set("Authorization", `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

/**
 * Maps React Admin queries to Strapi API
 */
export const strapiDataProvider = {
  getList: async (resource, params) => {
    // Default to 20 items per page if not specified
    const { page = 1, perPage = 20 } = params.pagination || {};
    const { field = "createdAt", order = "DESC" } = params.sort || {};

    // Query parameters for Strapi v4+
    // Strapi v4 uses pagination[start] and pagination[limit] for offset-based pagination
    const query = {
      sort: `${field}:${order}`,
      "pagination[start]": (page - 1) * perPage,
      "pagination[limit]": perPage,
    };

    // Add population for specific resources
    if (resource === "questions") {
      // Use '*' to populate all relations (topic, subject, etc.)
      // Strapi v4 doesn't support comma-separated values like 'topic,subject'
      query["populate"] = "*";
    } else if (resource === "quizzes") {
      // Only populate if explicitly requested in meta
      // This prevents breaking the list view if populate causes issues
      if (params.meta && params.meta.populate) {
        const populateValue = params.meta.populate;
        // Handle array format: ['topic', 'subject'] -> use '*' to populate all
        // Handle string format: 'topic,subject' or '*' -> as is
        // Handle object format: { topic: true, subject: true } -> as is
        if (Array.isArray(populateValue)) {
          query["populate"] = "*";
        } else if (typeof populateValue === "object") {
          // For nested object populate in Strapi v5
          Object.keys(populateValue).forEach((key, index) => {
            query[`populate[${index}]`] = key;
          });
        } else {
          query["populate"] = populateValue;
        }
      }
      // Don't add default populate for list view to avoid breaking queries
    } else if (resource === "quiz-results") {
      // Handle populate for quiz-results
      if (params.meta && params.meta.populate) {
        const populateValue = params.meta.populate;
        if (
          typeof populateValue === "object" &&
          !Array.isArray(populateValue)
        ) {
          // For nested populate like: { quiz: { populate: ['subject', 'topic'] } }
          // Convert to Strapi v5 format: populate[quiz][populate][0]=subject
          Object.keys(populateValue).forEach((key) => {
            const value = populateValue[key];
            if (typeof value === "object" && value.populate) {
              // Nested populate
              if (Array.isArray(value.populate)) {
                value.populate.forEach((nestedKey, idx) => {
                  query[`populate[${key}][populate][${idx}]`] = nestedKey;
                });
              }
            } else if (value === true) {
              // Simple populate
              query[`populate[${key}]`] = "*";
            }
          });
        } else if (Array.isArray(populateValue)) {
          query["populate"] = "*";
        } else {
          query["populate"] = populateValue;
        }
      }
    } else if (resource === "subjects") {
      // Handle populate for subjects
      if (params.meta && params.meta.populate) {
        const populateValue = params.meta.populate;
        if (
          typeof populateValue === "object" &&
          !Array.isArray(populateValue)
        ) {
          // For nested object populate: { topics: true, quizzes: true, coverpage: true }
          Object.keys(populateValue).forEach((key, index) => {
            query[`populate[${index}]`] = key;
          });
        } else if (Array.isArray(populateValue)) {
          query["populate"] = "*";
        } else {
          query["populate"] = populateValue;
        }
      }
    }

    // Filter Handling - only add valid filters
    if (params.filter && Object.keys(params.filter).length > 0) {
      Object.keys(params.filter).forEach((key) => {
        const value = params.filter[key];
        // Skip empty or undefined values
        if (value === undefined || value === null || value === "") return;

        if (key === "q") {
          // Global search for users
          query[`filters[username][$containsi]`] = value;
        } else if (key === "id" || key === "documentId") {
          query[`filters[${key}][$eq]`] = value;
        } else if (
          key === "creator" ||
          key === "topic" ||
          key === "subjectRef" ||
          typeof value === "number"
        ) {
          // For relation fields and numeric values, use $eq
          query[`filters[${key}][$eq]`] = value;
        } else {
          // For text fields, use $containsi
          query[`filters[${key}][$containsi]`] = value;
        }
      });
    }

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
          // If topic is populated object, keep it as is (ReferenceField can extract ID)
          normalized.topic = item.topic;
        } else if (item.topic) {
          // If topic is just an ID, keep it as is
          normalized.topic = item.topic;
        }

        if (item.subject && typeof item.subject === "object") {
          // If subject is populated object, keep it as is (ReferenceField can extract ID)
          normalized.subject = item.subject;
        } else if (item.subject) {
          // If subject is just an ID, keep it as is
          normalized.subject = item.subject;
        }
      }

      return normalized;
    });

    // Total Count Calculation
    // 1. Try X-Total-Count header
    let total = parseInt(headers.get("x-total-count"), 10);

    // 2. Try content-range header
    if (isNaN(total) && headers.get("content-range")) {
      total = parseInt(headers.get("content-range").split("/").pop(), 10);
    }

    // 3. Try json.meta.pagination
    if (isNaN(total) && json.meta && json.meta.pagination) {
      total = json.meta.pagination.total;
    }

    // 4. Fallback for "Users" endpoint which often lacks meta:
    // If we don't know the total, React Admin can struggle.
    // We can check if we received a full page. If so, there is likely more.
    if (isNaN(total)) {
      // This is a naive heuristic but works for basic navigation if total is missing
      total =
        data.length >= perPage
          ? page * perPage + 1
          : (page - 1) * perPage + data.length;
    }

    return {
      data,
      total,
    };
  },

  getOne: async (resource, params) => {
    const query = {};
    if (resource === "questions") {
      // Use '*' to populate all relations (topic, subject, etc.)
      query["populate"] = "*";
    } else if (resource === "quizzes") {
      query["populate"] = "*"; // Populate all relations (topic, subject, questions, creator, etc.)
    } else if (resource === "subjects") {
      // Populate subjects with all nested relations
      if (params.meta && params.meta.populate) {
        const populateValue = params.meta.populate;
        if (
          typeof populateValue === "object" &&
          !Array.isArray(populateValue)
        ) {
          // For nested object populate
          let simpleIndex = 0;
          Object.keys(populateValue).forEach((key) => {
            if (
              typeof populateValue[key] === "object" &&
              populateValue[key].populate
            ) {
              // Nested populate like: topics: { populate: ['contents', 'quizzes'] }
              const nestedKeys = populateValue[key].populate || [];
              nestedKeys.forEach((nestedKey, nestedIndex) => {
                query[`populate[${key}][populate][${nestedIndex}]`] = nestedKey;
              });
            } else {
              // Simple populate
              query[`populate[${simpleIndex}]`] = key;
              simpleIndex++;
            }
          });
        } else if (Array.isArray(populateValue)) {
          // Array format: ['topics', 'quizzes', 'coverpage']
          populateValue.forEach((key, index) => {
            query[`populate[${index}]`] = key;
          });
        } else {
          query["populate"] = populateValue;
        }
      } else {
        query["populate"] = "*"; // Default to populate all
      }
    }

    // Strapi v5 uses documentId for fetching single items
    // Always use filter-based approach which works for both documentId and numeric id
    // First try documentId filter, if that fails try id filter
    query["filters[documentId][$eq]"] = params.id;
    const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;

    const { json } = await httpClient(url);

    // Filter query returns an array, get the first item
    const rawData = Array.isArray(json) ? json : json.data || [];
    if (rawData.length === 0) {
      // If documentId didn't work, try with numeric id filter
      delete query["filters[documentId][$eq]"];
      query["filters[id][$eq]"] = params.id;
      const fallbackUrl = `${apiUrl}/${resource}?${queryString.stringify(
        query
      )}`;
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
  },

  getMany: async (resource, params) => {
    const query = {
      [`filters[id][$in]`]: params.ids,
    };
    const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
    const { json } = await httpClient(url);
    const rawData = Array.isArray(json) ? json : json.data || [];
    return { data: rawData };
  },

  getManyReference: async (resource, params) => {
    // Similar to getList but scoped to a target
    // For now, reuse logic if needed or just implement basic getList params
    // This is a placeholder for future expansion
    return { data: [], total: 0 };
  },

  update: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({ data: params.data }),
    });
    const data = json.data || json;
    return { data: { ...data, id: data.id } };
  },

  create: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}`, {
      method: "POST",
      body: JSON.stringify({ data: params.data }),
    });
    const data = json.data || json;
    return { data: { ...data, id: data.id } };
  },

  delete: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "DELETE",
    });
    const data = json.data || json;
    return { data: { ...data, id: data.id } };
  },
};
