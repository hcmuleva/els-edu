#!/usr/bin/env node

/**
 * Unified Demo Data Seed Script (Production Ready)
 *
 * Creates complete demo data in one go:
 * - 3 Organizations
 * - 6 Kits
 * - 15 Users (5 per org) with full profile data
 * - All relationships configured
 *
 * Uses hybrid approach:
 * - REST for basic CRUD (kits, orgs)
 * - GraphQL for user registration & updates (matches client behavior)
 * - REST relation endpoints for connecting entities
 *
 * Usage: npm run seed:unified
 */

const http = require("http");
const fetch = require("node-fetch");

const API_BASE_URL = process.env.API_URL || "http://localhost:1337";
const BEARER_TOKEN = process.env.BEARER_TOKEN || "";

let adminToken = BEARER_TOKEN ? BEARER_TOKEN : null;

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
 * REST request helper
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 1337,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (adminToken) {
      options.headers["Authorization"] = `Bearer ${adminToken}`;
    }

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, data: { raw: responseData } });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * GraphQL mutation helper
 */
async function graphqlMutation(query, variables = {}) {
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
      user_role: "USER",
      user_experience_level: "PROFESSIONAL",
    },
  ];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seed() {
  log.header("🌱 Starting Unified Demo Data Seeding...");
  log.info(`API URL: ${API_BASE_URL}\n`);

  if (adminToken) {
    log.success(`Using Bearer token: ${adminToken.substring(0, 20)}...`);
  } else {
    log.warn(
      "⚠️  No BEARER_TOKEN provided. Some operations may fail with 403."
    );
    log.info(
      `   Set token: ${colors.cyan}BEARER_TOKEN=<token> npm run seed:unified${colors.reset}\n`
    );
  }

  try {
    // ==================== STEP 1: Create Kits ====================
    log.header("📚 Creating kits...");
    const createdKits = [];

    for (const kit of DEMO_KITS) {
      try {
        const response = await makeRequest("POST", "/api/kits", { data: kit });
        if (response.status === 200 || response.status === 201) {
          const kitId = response.data.data?.documentId;
          if (kitId) {
            // include placeholders to track org links and created level/lesson
            createdKits.push({
              ...kit,
              id: kitId,
              orgIds: [],
              kitlevel_id: null,
              lesson_id: null,
            });
            log.success(`${kit.name}`);
          } else {
            log.error(`${kit.name} - No ID returned`);
          }
        } else {
          log.error(`${kit.name} - Status ${response.status}`);
        }
      } catch (err) {
        log.error(`${kit.name} - ${err.message}`);
      }
      await delay(150);
    }
    log.info(`Created ${createdKits.length}/${DEMO_KITS.length} kits\n`);

    // ==================== STEP 2: Create Organizations ====================
    log.header("🏢 Creating organizations...");
    const createdOrgs = [];

    for (const orgData of DEMO_ORGS) {
      try {
        const response = await makeRequest("POST", "/api/orgs", {
          data: orgData,
        });

        if (response.status === 200 || response.status === 201) {
          const orgId = response.data.data?.documentId;
          if (orgId) {
            // initialize org entry with explicit fields to avoid dynamic mutability issues
            const orgEntry = {
              ...orgData,
              id: orgId,
              userIds: [],
              // placeholders that we will populate during seeding
              org_metadata_id: null,
              credentials: [],
              // placeholders for levels/lessons created later
              kitlevels: [],
              lessons: [],
            };
            createdOrgs.push(orgEntry);
            log.success(`${orgData.org_name}`);

            // Create related org-metadata for this org
            try {
              // Read tokens/usernames from env if provided; DO NOT hardcode sensitive tokens here.
              // Accept safe default usernames if you provided them; tokens must be supplied via env vars only
              const githubUsername =
                process.env.GITHUB_USERNAME || "gyanved124-stack";
              const githubToken = process.env.GITHUB_TOKEN || ""; // keep empty unless provided via env
              const dockerUsername = process.env.DOCKER_USERNAME || "elsorg";
              const dockerToken = process.env.DOCKER_TOKEN || "";
              const vercelToken = process.env.VERCEL_TOKEN || "";

              // Create org-metadata without trying to link the org from the metadata side.
              // For a one-to-one relation where org has the inversedBy side, we must update
              // the org to connect the metadata after the metadata record exists.
              const orgMetaPayload = {
                data: {
                  github_username: githubUsername,
                  github_token: githubToken,
                  docker_username: dockerUsername,
                  docker_token: dockerToken,
                  vercel_token: vercelToken,
                },
              };

              const metaResp = await makeRequest(
                "POST",
                "/api/org-metadatas",
                orgMetaPayload
              );
              if (metaResp.status === 200 || metaResp.status === 201) {
                const metaId = metaResp.data.data?.documentId || null;
                if (metaId) {
                  // Now update the org to point to this metadata
                  try {
                    const connectResp = await makeRequest(
                      "PUT",
                      `/api/orgs/${orgId}`,
                      {
                        data: {
                          org_metadatum: {
                            connect: [{ documentId: metaId }],
                          },
                        },
                      }
                    );

                    if (
                      connectResp.status === 200 ||
                      connectResp.status === 204
                    ) {
                      // update the orgEntry we created above
                      orgEntry.org_metadata_id = metaId;
                      log.success(
                        `${orgData.org_name} - org-metadata created & linked`
                      );
                    } else {
                      // metadata exists but linking failed
                      orgEntry.org_metadata_id = metaId;
                      log.warn(
                        `${orgData.org_name} - org-metadata created but failed to link (status ${connectResp.status})`
                      );
                    }
                  } catch (linkErr) {
                    orgEntry.org_metadata_id = metaId;
                    log.warn(
                      `${orgData.org_name} - org-metadata created but linking error: ${linkErr.message}`
                    );
                  }
                } else {
                  log.warn(
                    `${orgData.org_name} - org-metadata created but no ID returned`
                  );
                }
              } else {
                log.warn(
                  `${orgData.org_name} - Failed to create org-metadata (status ${metaResp.status})`
                );
              }
            } catch (metaErr) {
              log.warn(
                `${orgData.org_name} - org-metadata creation error: ${metaErr.message}`
              );
            }
          } else {
            log.error(`${orgData.org_name} - No ID returned`);
          }
        } else {
          log.error(`${orgData.org_name} - Status ${response.status}`);
        }
      } catch (err) {
        log.error(`${orgData.org_name} - ${err.message}`);
      }
      await delay(150);
    }
    log.info(
      `Created ${createdOrgs.length}/${DEMO_ORGS.length} organizations\n`
    );

    // ==================== STEP 3: Create Users & Update Profiles ====================
    log.header("👥 Creating users with profiles...");

    for (let orgIndex = 0; orgIndex < createdOrgs.length; orgIndex++) {
      const org = createdOrgs[orgIndex];
      const orgUsers = generateUsersForOrg(orgIndex);

      console.log(
        `\n  ${colors.cyan}Users for ${org.org_name}:${colors.reset}`
      );

      for (const user of orgUsers) {
        try {
          let userId, userDocumentId;

          // Step 3a: Register user via GraphQL
          const registerMutation = `
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

          try {
            const registerResult = await graphqlMutation(registerMutation, {
              input: {
                username: user.username,
                email: user.email,
                password: user.password,
              },
            });

            userId = registerResult?.register?.user?.id;
            userDocumentId = registerResult?.register?.user?.documentId;

            if (!userId) {
              log.error(`    ${user.username} - Registration failed`);
              continue;
            }
          } catch (regErr) {
            // If user already exists, try to find and update them
            if (regErr.message.includes("already taken")) {
              // As a reliable fallback, fetch all users via REST and match by username/email
              try {
                const usersResp = await makeRequest("GET", "/api/users");
                const allUsers = Array.isArray(usersResp.data)
                  ? usersResp.data
                  : usersResp.data?.data || usersResp.data || [];

                const found = allUsers.find(
                  (u) =>
                    (u.username && u.username === user.username) ||
                    (u.email && u.email === user.email)
                );

                if (found) {
                  userId =
                    found.id || found._id || found.documentId || found.id;
                  userDocumentId = found.documentId || userId;
                } else {
                  log.error(
                    `    ${user.username} - User marked taken but not found via REST`
                  );
                  continue;
                }
              } catch (restErr) {
                log.error(
                  `    ${user.username} - Failed lookup via REST: ${restErr.message}`
                );
                continue;
              }
            } else {
              throw regErr;
            }
          }

          // Step 3b: Update user profile via GraphQL
          // Step 3b: Update user profile via GraphQL
          const updateMutation = `
            mutation updateUser($id: ID!, $data: UsersPermissionsUserInput!) {
              updateUsersPermissionsUser(id: $id, data: $data) {
                data {
                  username
                  first_name
                  last_name
                  mobile_number
                  user_role
                  user_experience_level
                }
              }
            }
          `;

          // Build profile data based on user role
          const profileData = {
            first_name: user.first_name,
            last_name: user.last_name,
            mobile_number: user.mobile_number,
            confirmed: true,
            blocked: false,
            user_role: user.user_role,
            user_experience_level: user.user_experience_level,
            user_status: "APPROVED",
            privacy_accepted: true,
          };

          // Add getstarted_completed only for admins
          if (user.user_role === "ADMIN") {
            profileData.getstarted_completed = true;
          }

          const updateResult = await graphqlMutation(updateMutation, {
            id: String(userId),
            data: profileData,
          });

          const updatedUser = updateResult?.updateUsersPermissionsUser?.data;

          if (updatedUser) {
            org.userIds.push(userDocumentId || userId);
            // store credentials for output (email/password) for later writing to SEED_OUTPUT.md
            if (!org.credentials) org.credentials = [];
            org.credentials.push({
              email: user.email,
              password: user.password,
              role: user.user_role,
              documentId: userDocumentId || userId,
            });
            const userType = user.user_role === "ADMIN" ? "[ADMIN]" : "[USER ]";
            console.log(
              `    ${colors.green}✓${colors.reset} ${userType} ${user.first_name} ${user.last_name}`
            );
          } else {
            log.error(
              `    ${user.first_name} ${user.last_name} - Profile update failed`
            );
          }
        } catch (err) {
          log.error(
            `    ${user.first_name} ${user.last_name} - ${err.message}`
          );
        }
        await delay(150);
      }
    }

    const totalUsers = createdOrgs.reduce(
      (sum, org) => sum + org.userIds.length,
      0
    );
    log.info(`Created ${totalUsers} users\n`);

    // ==================== STEP 4: Connect Users to Organizations ====================
    log.header("🔗 Connecting users to organizations...");

    for (const org of createdOrgs) {
      if (org.userIds.length === 0) continue;

      try {
        // Use the connect relation endpoint to associate users
        const updateOrgResponse = await makeRequest(
          "PUT",
          `/api/orgs/${org.id}`,
          {
            data: {
              users: {
                connect: org.userIds.map((id) => ({ documentId: id })),
              },
            },
          }
        );

        if (
          updateOrgResponse.status === 200 ||
          updateOrgResponse.status === 204
        ) {
          log.success(
            `${org.org_name} - ${org.userIds.length} users connected`
          );
        } else {
          log.error(
            `${org.org_name} - Failed to connect users (status ${updateOrgResponse.status})`
          );
        }
      } catch (err) {
        log.error(`${org.org_name} - ${err.message}`);
      }
      await delay(150);
    }

    // ==================== STEP 5: Assign Kits to Organizations ====================
    log.header("📖 Assigning kits to organizations...");

    if (createdKits.length > 0 && createdOrgs.length > 0) {
      for (const org of createdOrgs) {
        // Randomly select 2 kits for this org
        const kitCopy = [...createdKits];
        const selectedKits = [];

        for (let i = 0; i < 2 && kitCopy.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * kitCopy.length);
          selectedKits.push(kitCopy[randomIndex]);
          kitCopy.splice(randomIndex, 1);
        }

        for (const kit of selectedKits) {
          try {
            const kitUpdateResponse = await makeRequest(
              "PUT",
              `/api/kits/${kit.id}`,
              {
                data: {
                  orgs: {
                    connect: [{ documentId: org.id }],
                  },
                },
              }
            );

            if (
              kitUpdateResponse.status === 200 ||
              kitUpdateResponse.status === 204
            ) {
              // record that this kit is linked to this org
              kit.orgIds = kit.orgIds || [];
              kit.orgIds.push(org.id);
              log.success(`${kit.name} → ${org.org_name}`);
            } else {
              log.error(
                `${kit.name} → ${org.org_name} - Status ${kitUpdateResponse.status}`
              );
            }
          } catch (err) {
            log.error(`${kit.name} → ${org.org_name} - ${err.message}`);
          }
          await delay(150);
        }
      }
    }

    // ==================== STEP 6: Create 1 Level + 1 Lesson per Kit and link to orgs ====================
    log.header("📚 Creating 1 level + 1 lesson per kit and linking to orgs...");

    for (const kit of createdKits) {
      try {
        const linkedOrgIds =
          Array.isArray(kit.orgIds) && kit.orgIds.length > 0 ? kit.orgIds : [];

        // Build org connect array
        const orgConnect = linkedOrgIds.map((id) => ({ documentId: id }));

        // Create a kitlevel and connect it to the kit and orgs
        const levelPayload = {
          data: {
            title: `${kit.name} - Level 1`,
            description: `Auto-generated level for ${kit.name}`,
            order: 1,
            is_free: true,
            kit: { connect: [{ documentId: kit.id }] },
            orgs: { connect: orgConnect },
          },
        };

        const levelResp = await makeRequest(
          "POST",
          "/api/kitlevels",
          levelPayload
        );

        if (levelResp.status === 200 || levelResp.status === 201) {
          const levelId = levelResp.data.data?.documentId;
          if (levelId) {
            kit.kitlevel_id = levelId;
            log.success(`Level created for kit: ${kit.name}`);

            // Create a lesson connected to kit + kitlevel + orgs
            const lessonPayload = {
              data: {
                title: `${kit.name} - Lesson 1`,
                duration: "10m",
                order: 1,
                is_free: true,
                kit: { connect: [{ documentId: kit.id }] },
                kitlevel: { connect: [{ documentId: levelId }] },
                orgs: { connect: orgConnect },
              },
            };

            const lessonResp = await makeRequest(
              "POST",
              "/api/lessons",
              lessonPayload
            );
            if (lessonResp.status === 200 || lessonResp.status === 201) {
              const lessonId = lessonResp.data.data?.documentId;
              if (lessonId) {
                kit.lesson_id = lessonId;
                log.success(`Lesson created for kit: ${kit.name}`);

                // Record on org entries for output
                for (const orgId of linkedOrgIds) {
                  const orgEntry = createdOrgs.find((o) => o.id === orgId);
                  if (orgEntry) {
                    orgEntry.kitlevels = orgEntry.kitlevels || [];
                    orgEntry.lessons = orgEntry.lessons || [];
                    orgEntry.kitlevels.push({
                      kitName: kit.name,
                      documentId: levelId,
                    });
                    orgEntry.lessons.push({
                      kitName: kit.name,
                      documentId: lessonId,
                    });
                  }
                }
              } else {
                log.warn(
                  `Lesson for kit ${kit.name} created but no ID returned`
                );
              }
            } else {
              log.warn(
                `Failed to create lesson for kit ${kit.name} (status ${lessonResp.status})`
              );
            }
          } else {
            log.warn(`Level created for ${kit.name} but no ID returned`);
          }
        } else {
          log.warn(
            `Failed to create level for kit ${kit.name} (status ${levelResp.status})`
          );
        }
      } catch (err) {
        log.warn(
          `Error creating level/lesson for kit ${kit.name}: ${err.message}`
        );
      }
      await delay(150);
    }

    log.header("✅ Seeding completed successfully!");
    log.info("📊 Final Summary:");
    console.log(
      `  ${colors.cyan}Organizations:${colors.reset} ${createdOrgs.length}`
    );
    console.log(`  ${colors.cyan}Users:${colors.reset} ${totalUsers}`);
    console.log(`  ${colors.cyan}Kits:${colors.reset} ${createdKits.length}`);

    log.info("📋 Demo Login Credentials:");
    createdOrgs.forEach((org, index) => {
      const orgNum = index + 1;
      console.log();
      console.log(`  ${colors.yellow}${org.org_name}${colors.reset}`);
      console.log(
        `    Admin Email:    ${colors.cyan}admin-org${orgNum}@demo.test${colors.reset}`
      );
      console.log(
        `    Admin Password: ${colors.cyan}AdminPass123!${colors.reset}`
      );
      console.log(`    Total Users:    ${colors.cyan}5${colors.reset}`);
    });
    // Write credentials and created IDs to a markdown file for testers
    try {
      const fs = require("fs");
      const outLines = [];
      outLines.push("# Seed Output\n");
      outLines.push(`Generated: ${new Date().toISOString()}\n`);
      outLines.push("## Organizations and metadata\n");

      createdOrgs.forEach((org) => {
        outLines.push(`### ${org.org_name}`);
        outLines.push(`- org_documentId: ${org.id}`);
        if (org.org_metadata_id)
          outLines.push(`- org_metadata_id: ${org.org_metadata_id}`);
        outLines.push(`- contact_email: ${org.contact_email}`);
        outLines.push(`- contact_phone: ${org.contact_phone}`);
        outLines.push("");

        if (Array.isArray(org.credentials) && org.credentials.length > 0) {
          outLines.push(`#### Users for ${org.org_name}`);
          outLines.push(`| role | email | password | documentId |`);
          outLines.push(`|---|---|---|---|`);
          org.credentials.forEach((c) => {
            outLines.push(
              `| ${c.role} | ${c.email} | ${c.password} | ${c.documentId} |`
            );
          });
          outLines.push("");
        }

        // Output created kitlevels and lessons (if any)
        if (Array.isArray(org.kitlevels) && org.kitlevels.length > 0) {
          outLines.push(`#### Kit Levels for ${org.org_name}`);
          outLines.push(`| kit | kitlevel_documentId |`);
          outLines.push(`|---|---|`);
          org.kitlevels.forEach((l) => {
            outLines.push(`| ${l.kitName} | ${l.documentId} |`);
          });
          outLines.push("");
        }

        if (Array.isArray(org.lessons) && org.lessons.length > 0) {
          outLines.push(`#### Lessons for ${org.org_name}`);
          outLines.push(`| kit | lesson_documentId |`);
          outLines.push(`|---|---|`);
          org.lessons.forEach((ls) => {
            outLines.push(`| ${ls.kitName} | ${ls.documentId} |`);
          });
          outLines.push("");
        }
      });

      outLines.push("## External tokens (NOT STORED)");
      outLines.push(
        "The seed script does NOT write any external tokens you pasted (GitHub/Docker/Vercel). If you need the seed to populate those fields, set the following environment variables before running the seed: GITHUB_USERNAME, GITHUB_TOKEN, DOCKER_USERNAME, DOCKER_TOKEN, VERCEL_TOKEN. Do NOT store secrets in the repository. Rotate any tokens you pasted immediately."
      );

      const out = outLines.join("\n");
      const outPath = __dirname + "/SEED_OUTPUT.md";
      fs.writeFileSync(outPath, out, { encoding: "utf8" });
      log.success(`Wrote seed output to ${outPath}`);
    } catch (wfErr) {
      log.warn(`Failed to write SEED_OUTPUT.md: ${wfErr.message}`);
    }

    log.info(
      "🚀 Ready for testing! Login at the frontend with any admin account above."
    );
    console.log();
  } catch (err) {
    log.error(`Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

seed();
