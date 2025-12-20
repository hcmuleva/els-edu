// Main data provider - orchestrates all operations
import { httpClient } from "./providers/httpClient";
import {
    getList,
    getOne,
    getMany,
    getManyReference,
} from "./providers/queries";
import {
    createResource,
    updateResource,
    deleteResource,
} from "./providers/mutations";

/**
 * Strapi Data Provider for React Admin
 * Now organized into separate modules for better maintainability
 */
export const strapiDataProvider = {
    getList: (resource, params) => getList(httpClient, resource, params),

    getOne: (resource, params) => getOne(httpClient, resource, params),

    getMany: (resource, params) => getMany(httpClient, resource, params),

    getManyReference: (resource, params) =>
        getManyReference(httpClient, resource, params),

    update: (resource, params) => updateResource(httpClient, resource, params),

    create: (resource, params) => createResource(httpClient, resource, params),

    delete: (resource, params) => deleteResource(httpClient, resource, params),
};
