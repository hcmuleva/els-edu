// Org service for managing organization-related API calls using React Admin dataProvider

import { strapiDataProvider } from "../api/dataProvider";

// Default org configuration
// This should be the documentId of the "Edu Org"
export const DEFAULT_ORG_DOCUMENT_ID = "qvn5sg2bvvhh74sf2m4qd7to";
export const DEFAULT_ORG_NAME = "Edu Org";

/**
 * Get the default organization details using dataProvider
 * @returns {Promise<Object>} - The org data
 */
export const getDefaultOrg = async () => {
  try {
    const { data } = await strapiDataProvider.getList("orgs", {
      filter: { documentId: DEFAULT_ORG_DOCUMENT_ID },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "id", order: "ASC" },
    });

    return data?.[0] || null;
  } catch (error) {
    console.error("Error fetching default org:", error);
    throw error;
  }
};

/**
 * Add a user to an organization by updating the user's org relation
 * Uses documentId for Strapi v5 relations
 * @param {string} orgDocumentId - The documentId of the org to add user to
 * @param {number} userId - The numeric ID of the user (for the update call)
 * @returns {Promise<Object>} - The updated user data
 */
export const addUserToOrg = async (orgDocumentId, userId) => {
  if (!orgDocumentId || !userId) {
    throw new Error("Missing orgDocumentId or userId");
  }

  try {
    // Update the user's org relation using documentId (Strapi v5)
    const result = await strapiDataProvider.update("users", {
      id: userId,
      data: {
        org: orgDocumentId, // Use documentId for relation in Strapi v5
      },
      previousData: {},
    });

    console.log("User assigned to org:", result);
    return result;
  } catch (error) {
    console.error("Error adding user to org:", error);
    throw error;
  }
};

/**
 * Add a user to the default organization (Edu Org)
 * @param {number} userId - The numeric ID of the user
 * @returns {Promise<Object>} - The updated user data
 */
export const addUserToDefaultOrg = async (userId) => {
  return addUserToOrg(DEFAULT_ORG_DOCUMENT_ID, userId);
};

/**
 * Update user data using dataProvider
 * @param {number} userId - The numeric ID of the user
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated user data
 */
export const updateUserData = async (userId, data) => {
  if (!userId) {
    throw new Error("Missing userId");
  }

  try {
    const result = await strapiDataProvider.update("users", {
      id: userId,
      data,
      previousData: {},
    });

    console.log("User updated:", result);
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};
