// Query builder utilities for Strapi API
import queryString from "query-string";

/**
 * Builds filter query parameters for Strapi v5
 */
export const buildFilters = (resource, filters) => {
  const query = {};

  if (!filters || Object.keys(filters).length === 0) {
    return query;
  }

  Object.keys(filters).forEach((key) => {
    const value = filters[key];
    // Skip empty or undefined values
    if (value === undefined || value === null || value === "") return;

    // Handle pre-formatted filter keys (e.g., 'filters[user][documentId][$eq]')
    if (key.startsWith("filters[")) {
      query[key] = value;
      return;
    }

    // Handle nested relation filters with bracket notation (e.g., 'user[documentId]')
    const bracketMatch = key.match(/^(\w+)\[(\w+)\]$/);
    if (bracketMatch) {
      const [, relation, field] = bracketMatch;
      query[`filters[${relation}][${field}][$eq]`] = value;
      return;
    }

    if (key === "q") {
      // Global search - use appropriate field based on resource
      if (resource === "users") {
        query[`filters[username][$containsi]`] = value;
      } else if (resource === "contents") {
        query[`filters[title][$containsi]`] = value;
      } else if (resource === "questions") {
        query[`filters[questionText][$containsi]`] = value;
      } else if (resource === "quizzes") {
        query[`filters[title][$containsi]`] = value;
      } else {
        // Default to 'name' for subjects, topics, courses, etc.
        query[`filters[name][$containsi]`] = value;
      }
    } else if (key === "id" || key === "documentId") {
      query[`filters[${key}][$eq]`] = value;
    } else if (
      key === "creator" ||
      key === "topic" ||
      key === "subject" ||
      key === "quiz" ||
      key === "user" ||
      key === "course" ||
      key === "questions" ||
      typeof value === "number"
    ) {
      // For relation fields and numeric values, use $eq
      query[`filters[${key}][$eq]`] = value;
    } else {
      // For text fields, use $containsi
      query[`filters[${key}][$containsi]`] = value;
    }
  });

  return query;
};

/**
 * Builds populate query parameters for Strapi v5
 */
export const buildPopulate = (resource, meta) => {
  const query = {};

  // Default populations for specific resources
  if (resource === "questions") {
    query["populate"] = "*";
    return query;
  }

  if (resource === "quizzes") {
    if (meta && meta.populate) {
      const populateValue = meta.populate;
      if (Array.isArray(populateValue)) {
        query["populate"] = "*";
      } else if (typeof populateValue === "object") {
        Object.keys(populateValue).forEach((key, index) => {
          query[`populate[${index}]`] = key;
        });
      } else {
        query["populate"] = populateValue;
      }
    }
    return query;
  }

  // Generic populate handler for all other resources/cases where meta.populate is provided
  if (meta && meta.populate) {
    const populateValue = meta.populate;

    // Handle Object structure (nested populates)
    if (typeof populateValue === "object" && !Array.isArray(populateValue)) {
      Object.keys(populateValue).forEach((key) => {
        const value = populateValue[key];

        // Check if value is an object configuration
        if (typeof value === "object") {
          // Handle 'fields' inside populate
          if (value.fields && Array.isArray(value.fields)) {
            value.fields.forEach((field, idx) => {
              query[`populate[${key}][fields][${idx}]`] = field;
            });
          }

          // Handle nested 'populate'
          if (value.populate) {
            if (Array.isArray(value.populate)) {
              value.populate.forEach((nestedKey, idx) => {
                query[`populate[${key}][populate][${idx}]`] = nestedKey;
              });
            } else if (typeof value.populate === "object") {
              // Deep nesting - recursive logic could go here, but for now support 1 level deep object style
              // e.g. populate: { multimedia: true }
              Object.keys(value.populate).forEach((nestedKey) => {
                const nestedValue = value.populate[nestedKey];

                if (nestedValue === true) {
                  query[`populate[${key}][populate][${nestedKey}]`] = "*";
                } else if (typeof nestedValue === "object") {
                  // Handle fields for nested relation
                  if (nestedValue.fields && Array.isArray(nestedValue.fields)) {
                    nestedValue.fields.forEach((field, fIdx) => {
                      query[
                        `populate[${key}][populate][${nestedKey}][fields][${fIdx}]`
                      ] = field;
                    });
                  }

                  // Handle deeper populate if strictly needed (e.g. for grandchildren)
                  // For now, if no fields are specified and it is an object, we might assume wildcard?
                  // But if fields ARE specified, we must NOT wildcard, as that overrides fields in some Strapi versions or causes conflicts.
                  if (!nestedValue.fields && nestedValue.populate) {
                    // naive recursion or wildcard
                    query[
                      `populate[${key}][populate][${nestedKey}][populate]`
                    ] = "*"; // generic
                  }
                } else {
                  // String
                  query[`populate[${key}][populate][${nestedKey}]`] =
                    nestedValue;
                }
              });
            } else {
              // String or true
              query[`populate[${key}][populate]`] = value.populate;
            }
          }

          // If object is empty or just has other keys, we might still want to trigger the relation?
          // Usually populate: { fields: [] } implies we want the relation.
          // Strapi behaves: if you send populate[rel][fields], it populates rel.
        } else if (value === true) {
          query[`populate[${key}]`] = "*";
        }
      });
    }
    // Handle Array of strings e.g. ['subject', 'image']
    else if (Array.isArray(populateValue)) {
      populateValue.forEach((key, index) => {
        query[`populate[${index}]`] = key;
      });
    }
    // Handle simple string/wildcard e.g. "*"
    else {
      query["populate"] = populateValue;
    }
  }

  return query;
};

/**
 * Builds sort and pagination query parameters
 */
export const buildSortAndPagination = (params) => {
  const query = {};
  const { page = 1, perPage = 20 } = params.pagination || {};
  const { field = "createdAt", order = "DESC" } = params.sort || {};

  query["sort"] = `${field}:${order}`;
  query["pagination[start]"] = (page - 1) * perPage;
  query["pagination[limit]"] = perPage;

  return query;
};

/**
 * Builds complete query string
 */
export const buildQueryString = (queryObject) => {
  return queryString.stringify(queryObject);
};
