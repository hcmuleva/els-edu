import { fetchUtils } from 'react-admin';
import queryString from 'query-string';

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

// Custom HTTP client that adds JWT to all requests
const httpClient = (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    if (token) {
        options.headers.set('Authorization', `Bearer ${token}`);
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
        const { field = 'createdAt', order = 'DESC' } = params.sort || {};

        // Query parameters for Strapi v4+
        // Use only ONE set of pagination params (not both old and new)
        const query = {
            sort: `${field}:${order}`,
            start: (page - 1) * perPage,
            limit: perPage,
        };

        // Add population for specific resources
        if (resource === 'questions') {
            query['populate'] = 'topicRef';  // Populate the topic reference
        }

        // Filter Handling - only add valid filters
        if (params.filter && Object.keys(params.filter).length > 0) {
            Object.keys(params.filter).forEach(key => {
                const value = params.filter[key];
                // Skip empty or undefined values
                if (value === undefined || value === null || value === '') return;
                
                if (key === 'q') {
                    // Global search for users
                    query[`filters[username][$containsi]`] = value;
                } else if (key === 'id' || key === 'documentId') {
                    query[`filters[${key}][$eq]`] = value;
                } else if (key === 'creator' || typeof value === 'number') {
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
        const rawData = Array.isArray(json) ? json : (json.data || []);
        
        // Map data to React Admin format
        const data = rawData.map(item => ({
            ...item,
            id: item.id, // Primary key
            // Ensure any other required transformations happen here
        }));

        // Total Count Calculation
        // 1. Try X-Total-Count header
        let total = parseInt(headers.get('x-total-count'), 10);
        
        // 2. Try content-range header
        if (isNaN(total) && headers.get('content-range')) {
            total = parseInt(headers.get('content-range').split('/').pop(), 10);
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
            total = data.length >= perPage ? (page * perPage) + 1 : (page - 1) * perPage + data.length;
        }

        return {
            data,
            total,
        };
    },

    getOne: async (resource, params) => {
        const query = {};
        if (resource === 'questions') {
            query['populate'] = 'topicRef';
        }
        const url = `${apiUrl}/${resource}/${params.id}?${queryString.stringify(query)}`;
        const { json } = await httpClient(url);
        const data = json.data || json;
        return { data: { ...data, id: data.id } };
    },

    getMany: async (resource, params) => {
        const query = {
            [`filters[id][$in]`]: params.ids,
        };
        const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
        const { json } = await httpClient(url);
        const rawData = Array.isArray(json) ? json : (json.data || []);
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
            method: 'PUT',
            body: JSON.stringify({ data: params.data }),
        });
        const data = json.data || json;
        return { data: { ...data, id: data.id } };
    },

    create: async (resource, params) => {
        const { json } = await httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify({ data: params.data }),
        });
        const data = json.data || json;
        return { data: { ...data, id: data.id } };
    },

    delete: async (resource, params) => {
        const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        });
        const data = json.data || json;
        return { data: { ...data, id: data.id } };
    },
};
