#!/usr/bin/env node

/**
 * Demo Data Seed Script using GraphQL (matches client approach)
 * Creates 3 demo organizations with 5 users each and 2 kits per org
 *
 * Authentication: Uses GraphQL mutations via Apollo client
 * Registration flow: REGISTER (username, email, password) → UPDATE_USER_BY_ID (profile fields)
 *
 * Usage:
 * 1. Start backend: npm run dev
 * 2. In another terminal: npm run seed:graphql
 *
 * Note: This script uses GraphQL mutations and requires a running Strapi backend
 */

const fetch = require("node-fetch");

const API_BASE_URL = process.env.API_URL || "http://localhost:1337";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.blue}${msg}${colors.reset}`),
};

/**
 * GraphQL query helper
 */
async function graphqlQuery(query, variables = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    return result.data;
  } catch (err) {
    throw new Error(`GraphQL error: ${err.message}`);
  }
}

const DEMO_ORGS = [
  {
    org_name: "Tech Academy Pro",
    contact_email: "admin@techacademy.demo",
    contact_phone: 9876543210,
    org_status: "ACTIVE",
    description: "Professional technology training academy",
  },
  {
    org_name: "Digital Learn Hub",
    contact_email: "admin@digitallearn.demo",
    contact_phone: 9876543211,
    org_status: "ACTIVE",
    description: "Comprehensive digital learning platform",
  },
  {
    org_name: "Code Masters Institute",
    contact_email: "admin@codemasters.demo",
    contact_phone: 9876543212,
    org_status: "ACTIVE",
    description: "Expert coding and software development training",
  },
];

const DEMO_KITS = [
  {
    name: "React Fundamentals",
    category_type: "FRONTEND",
    experience_level: "SCHOOL",
    kit_type: "FREE",
    level: 1,
    is_featured: true,
    description: "Learn React basics and build interactive web applications",
  },
  {
    name: "Node.js Backend Development",
    category_type: "BACKEND",
    experience_level: "PROFESSIONAL",
    kit_type: "PAID",
    level: 2,
    is_featured: true,
    description: "Master backend development with Node.js and Express",
  },
  {
    name: "Docker & Containerization",
    category_type: "DOCKER",
    experience_level: "PROFESSIONAL",
    kit_type: "PAID",
    level: 3,
    is_featured: false,
    description: "Learn containerization with Docker and Docker Compose",
  },
  {
    name: "Python for Data Science",
    category_type: "LEARNING",
    experience_level: "COLLEGE",
    kit_type: "FREE",
    level: 2,
    is_featured: true,
    description: "Introduction to data science with Python",
  },
  {
    name: "DevOps Essentials",
    category_type: "DEVOPS",
    experience_level: "PROFESSIONAL",
    kit_type: "PAID",
    level: 3,
    is_featured: false,
    description: "Complete DevOps practices and CI/CD pipelines",
  },
  {
    name: "Testing Best Practices",
    category_type: "TESTING",
    experience_level: "PROFESSIONAL",
    kit_type: "FREEMIUM",
    level: 2,
    is_featured: false,
    description: "Unit testing, integration testing, and test automation",
  },
];

function generateUsersForOrg(orgIndex) {
  const orgNum = orgIndex + 1;
  return [
    {
      first_name: "Admin",
      last_name: `Org${orgNum}`,
      email: `admin-org${orgNum}@demo.test`,
      username: `admin-org${orgNum}`,
      password: "AdminPass123!",
      mobile_number: String(9800000000 + orgIndex * 1000),
      confirmed: true,
      blocked: false,
      user_role: "ADMIN",
      user_experience_level: "PROFESSIONAL",
    },
    {
      first_name: "John",
      last_name: `Student${orgNum}-1`,
      email: `john.student${orgNum}-1@demo.test`,
      username: `student${orgNum}-1`,
      password: "StudentPass123!",
      mobile_number: String(9800000001 + orgIndex * 1000),
      confirmed: true,
      blocked: false,
      user_role: "USER",
      user_experience_level: "SCHOOL",
    },
    {
      first_name: "Sarah",
      last_name: `Student${orgNum}-2`,
      email: `sarah.student${orgNum}-2@demo.test`,
      username: `student${orgNum}-2`,
      password: "StudentPass123!",
      mobile_number: String(9800000002 + orgIndex * 1000),
      confirmed: true,
      blocked: false,
      user_role: "USER",
      user_experience_level: "SCHOOL",
    },
    {
      first_name: "Mike",
      last_name: `Student${orgNum}-3`,
      email: `mike.student${orgNum}-3@demo.test`,
      username: `student${orgNum}-3`,
      password: "StudentPass123!",
      mobile_number: String(9800000003 + orgIndex * 1000),
      confirmed: true,
      blocked: false,
      user_role: "USER",
      user_experience_level: "COLLEGE",
    },
    {
      first_name: "Emily",
      last_name: `Student${orgNum}-4`,
      email: `emily.student${orgNum}-4@demo.test`,
      username: `student${orgNum}-4`,
      password: "StudentPass123!",
      mobile_number: String(9800000004 + orgIndex * 1000),
      confirmed: true,
      blocked: false,
      user_role: "USER",
      user_experience_level: "PROFESSIONAL",
    },
  ];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seed() {
  log.header("🌱 Starting GraphQL-based demo data seeding...");
  log.info(`API URL: ${API_BASE_URL}\n`);

  try {
    // Step 1: Create Kits
    log.header("📚 Creating kits...");
    const createdKits = [];

    for (const kit of DEMO_KITS) {
      try {
        const query = `
          mutation createKit($data: KitInput!) {
            createKit(data: $data) {
              data {
                documentId
                name
              }
            }
          }
        `;

        const data = await graphqlQuery(query, { data: kit });
        const kitId = data?.createKit?.data?.documentId;

        if (kitId) {
          createdKits.push({ ...kit, id: kitId });
          log.success(`${kit.name}`);
        } else {
          log.error(`${kit.name} - No ID returned`);
        }
      } catch (err) {
        log.error(`${kit.name} - ${err.message}`);
      }
      await delay(200);
    }
    log.info(`Created ${createdKits.length}/${DEMO_KITS.length} kits\n`);

    // Step 2: Create Organizations with Users
    log.header("🏢 Creating organizations and users...");
    const createdOrgs = [];

    for (let orgIndex = 0; orgIndex < DEMO_ORGS.length; orgIndex++) {
      const orgData = DEMO_ORGS[orgIndex];
      const orgUsers = generateUsersForOrg(orgIndex);

      try {
        const orgQuery = `
          mutation createOrg($data: OrgInput!) {
            createOrg(data: $data) {
              data {
                documentId
                org_name
              }
            }
          }
        `;

        const orgResult = await graphqlQuery(orgQuery, { data: orgData });
        const orgId = orgResult?.createOrg?.data?.documentId;

        if (!orgId) {
          log.error(`${orgData.org_name} - No ID returned`);
          continue;
        }

        log.success(`${orgData.org_name} (ID: ${orgId.substring(0, 8)}...)`);
        createdOrgs.push({ ...orgData, id: orgId, userIds: [] });

        console.log(`  ${colors.cyan}Creating 5 users...${colors.reset}`);

        for (const user of orgUsers) {
          try {
            // Step 2a: Register user (GraphQL)
            const registerQuery = `
              mutation register($input: UsersPermissionsRegisterInput!) {
                register(input: $input) {
                  jwt
                  user {
                    id
                    documentId
                    username
                    email
                  }
                }
              }
            `;

            const registerPayload = {
              username: user.username,
              email: user.email,
              password: user.password,
            };

            const registerResult = await graphqlQuery(registerQuery, {
              input: registerPayload,
            });

            const userId = registerResult?.register?.user?.id;
            const userDocumentId = registerResult?.register?.user?.documentId;

            if (!userId) {
              log.error(`    ${user.username} - Registration failed`);
              continue;
            }

            // Step 2b: Update user with profile fields (GraphQL)
            const updateQuery = `
              mutation updateUser($id: ID!, $data: UsersPermissionsUserInput!) {
                updateUsersPermissionsUser(id: $id, data: $data) {
                  data {
                    id
                    documentId
                    first_name
                    last_name
                    mobile_number
                    user_role
                    user_experience_level
                  }
                }
              }
            `;

            const updatePayload = {
              first_name: user.first_name,
              last_name: user.last_name,
              mobile_number: user.mobile_number,
              confirmed:
                typeof user.confirmed !== "undefined" ? user.confirmed : true,
              blocked:
                typeof user.blocked !== "undefined" ? user.blocked : false,
              user_role: user.user_role,
              user_experience_level: user.user_experience_level,
              org: orgId,
            };

            const updateResult = await graphqlQuery(updateQuery, {
              id: userId,
              data: updatePayload,
            });

            const updatedUser = updateResult?.updateUsersPermissionsUser?.data;

            if (updatedUser) {
              createdOrgs[orgIndex].userIds.push(userDocumentId || userId);
              const userType =
                user.user_role === "ADMIN" ? "[ADMIN]" : "[USER ]";
              console.log(
                `    ${colors.green}✓${colors.reset} ${userType} ${user.first_name} ${user.last_name}`
              );
            } else {
              log.error(
                `    ${user.first_name} ${user.last_name} - Failed to update profile`
              );
            }
          } catch (err) {
            log.error(
              `    ${user.first_name} ${user.last_name} - ${err.message}`
            );
          }
          await delay(200);
        }
      } catch (err) {
        log.error(`${orgData.org_name} - ${err.message}`);
      }
      await delay(300);
    }
    log.info(
      `Created ${createdOrgs.length}/${DEMO_ORGS.length} organizations\n`
    );

    // Step 3: Assign kits to organizations
    log.header("🔗 Assigning kits to organizations...");

    if (createdKits.length === 0 || createdOrgs.length === 0) {
      log.warn("No kits or orgs created, skipping kit assignment\n");
    } else {
      for (const org of createdOrgs) {
        const kitCopy = [...createdKits];
        const selectedKits = [];

        for (let i = 0; i < 2 && kitCopy.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * kitCopy.length);
          selectedKits.push(kitCopy[randomIndex]);
          kitCopy.splice(randomIndex, 1);
        }

        for (const kit of selectedKits) {
          try {
            const kitUpdateQuery = `
              mutation updateKit($id: ID!, $data: KitInput!) {
                updateKit(id: $id, data: $data) {
                  data {
                    documentId
                    name
                  }
                }
              }
            `;

            const kitUpdatePayload = {
              orgs: [org.id],
            };

            const kitUpdateResult = await graphqlQuery(kitUpdateQuery, {
              id: kit.id,
              data: kitUpdatePayload,
            });

            if (kitUpdateResult?.updateKit?.data) {
              log.success(`${kit.name} → ${org.org_name}`);
            } else {
              log.error(`${kit.name} → ${org.org_name} - Update failed`);
            }
          } catch (err) {
            log.error(`${kit.name} → ${org.org_name} - ${err.message}`);
          }
          await delay(200);
        }
      }
    }

    // Step 4: Print summary
    log.header("✅ Seed completed successfully!");
    log.info("📊 Summary:");
    console.log(
      `  ${colors.cyan}Organizations:${colors.reset} ${createdOrgs.length}`
    );
    console.log(
      `  ${colors.cyan}Users:${colors.reset} ${createdOrgs.reduce((sum, org) => sum + org.userIds.length, 0)}`
    );
    console.log(`  ${colors.cyan}Kits:${colors.reset} ${createdKits.length}`);

    log.info("📋 Demo Login Credentials:");
    createdOrgs.forEach((org, index) => {
      const orgNum = index + 1;
      console.log();
      console.log(`  ${colors.yellow}${org.org_name}${colors.reset}`);
      console.log(
        `    Email:    ${colors.cyan}admin-org${orgNum}@demo.test${colors.reset}`
      );
      console.log(`    Password: ${colors.cyan}AdminPass123!${colors.reset}`);
      console.log(`    Users:    ${org.userIds.length}`);
    });

    log.info("🚀 Ready for testing!");
    console.log();
  } catch (err) {
    log.error(`Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

seed();
