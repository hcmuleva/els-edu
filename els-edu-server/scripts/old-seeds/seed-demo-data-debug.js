#!/usr/bin/env node

/**
 * Demo Data Seed Script (DEBUG)
 * Same as seed-demo-data.js but prints full response bodies on failures
 */

const http = require("http");

const API_BASE_URL = process.env.API_URL || "http://localhost:1337";
const BEARER_TOKEN = process.env.BEARER_TOKEN || "";

let adminToken =
  typeof BEARER_TOKEN !== "undefined" && BEARER_TOKEN ? BEARER_TOKEN : null;

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
  log.header("🌱 Starting demo data seeding (DEBUG)...");
  log.info(`API URL: ${API_BASE_URL}\n`);

  if (BEARER_TOKEN) {
    log.success(`Using Bearer token: ${BEARER_TOKEN.substring(0, 20)}...`);
  } else {
    log.warn(
      "⚠️  No BEARER_TOKEN provided. If you get 403 errors, add the token:"
    );
    console.log(
      `   ${colors.cyan}BEARER_TOKEN=your_token_here npm run seed${colors.reset}\n`
    );
  }

  try {
    // Step 1: Create Kits
    log.header("📚 Creating kits...");
    const createdKits = [];

    for (const kit of DEMO_KITS) {
      try {
        const response = await makeRequest("POST", "/api/kits", { data: kit });
        if (response.status === 200 || response.status === 201) {
          const kitId = response.data.data?.documentId;
          if (kitId) {
            createdKits.push({ ...kit, id: kitId });
            log.success(`${kit.name}`);
          } else {
            log.error(`${kit.name} - No ID returned`);
          }
        } else {
          log.error(`${kit.name} - Status ${response.status}`);
          try {
            console.log(JSON.stringify(response.data, null, 2));
          } catch (e) {
            console.log(response.data);
          }
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
        const orgResponse = await makeRequest("POST", "/api/orgs", {
          data: orgData,
        });

        if (orgResponse.status === 200 || orgResponse.status === 201) {
          const orgId = orgResponse.data.data?.documentId;
          if (!orgId) {
            log.error(`${orgData.org_name} - No ID returned`);
            continue;
          }

          log.success(`${orgData.org_name} (ID: ${orgId.substring(0, 8)}...)`);
          createdOrgs.push({ ...orgData, id: orgId, userIds: [] });

          console.log(`  ${colors.cyan}Creating 5 users...${colors.reset}`);

          for (const user of orgUsers) {
            try {
              const registerPayload = {
                username: user.username,
                email: user.email,
                password: user.password,
              };

              // Prepare the update payload early so we can reuse it whether the
              // registration call created a new user or we need to update an
              // existing one found by email.
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

              const userResponse = await makeRequest(
                "POST",
                "/api/auth/local/register",
                registerPayload
              );

              if (userResponse.status === 200 || userResponse.status === 201) {
                const userId =
                  userResponse.data.user?.documentId ||
                  userResponse.data.user?.id;

                if (!userId) {
                  log.error(`    ${user.username} - No ID returned`);
                  continue;
                }

                const updatePayload = {
                  first_name: user.first_name,
                  last_name: user.last_name,
                  mobile_number: user.mobile_number,
                  confirmed:
                    typeof user.confirmed !== "undefined"
                      ? user.confirmed
                      : true,
                  blocked:
                    typeof user.blocked !== "undefined" ? user.blocked : false,
                  user_role: user.user_role,
                  user_experience_level: user.user_experience_level,
                  org: orgId,
                };

                // Use documentId-based update endpoint to match client helper:
                // PUT /api/users/update-doc/:documentId with { data: { ... } }
                const assignResponse = await makeRequest(
                  "PUT",
                  `/api/users/update-doc/${userId}`,
                  { data: updatePayload }
                );

                if (
                  assignResponse.status === 200 ||
                  assignResponse.status === 204
                ) {
                  createdOrgs[orgIndex].userIds.push(userId);
                  const userType =
                    user.user_role === "ADMIN" ? "[ADMIN]" : "[USER ]";
                  console.log(
                    `    ${colors.green}✓${colors.reset} ${userType} ${user.first_name} ${user.last_name}`
                  );
                } else {
                  log.error(
                    `    ${user.first_name} ${user.last_name} - Failed to update user (status ${assignResponse.status})`
                  );
                  try {
                    console.log(JSON.stringify(assignResponse.data, null, 2));
                  } catch (e) {
                    console.log(assignResponse.data);
                  }
                }
              } else {
                log.error(
                  `    ${user.first_name} ${user.last_name} - Status ${userResponse.status}`
                );
                try {
                  console.log(JSON.stringify(userResponse.data, null, 2));
                } catch (e) {
                  console.log(userResponse.data);
                }

                // If the user already exists, try to find it and update by documentId
                const errMsg = userResponse.data?.error?.message || "";
                if (errMsg.includes("Email or Username are already taken")) {
                  log.info(
                    `    ${user.email} appears to exist — fetching existing user by email`
                  );
                  try {
                    const findResp = await makeRequest(
                      "GET",
                      `/api/users?filters[email][$eq]=${encodeURIComponent(user.email)}`
                    );
                    try {
                      console.log(JSON.stringify(findResp.data, null, 2));
                    } catch (e) {
                      console.log(findResp.data);
                    }

                    let found = findResp.data?.data?.[0];
                    let existingId = found?.documentId || found?.id;
                    if (!existingId) {
                      // Try lookup by username as a fallback
                      log.info(`    lookup by username: ${user.username}`);
                      const findByUsername = await makeRequest(
                        "GET",
                        `/api/users?filters[username][$eq]=${encodeURIComponent(user.username)}`
                      );
                      try {
                        console.log(
                          JSON.stringify(findByUsername.data, null, 2)
                        );
                      } catch (e) {
                        console.log(findByUsername.data);
                      }
                      found = findByUsername.data?.data?.[0];
                      existingId = found?.documentId || found?.id;
                    }

                    if (existingId) {
                      log.info(
                        `    Found existing user documentId=${existingId}, attempting update`
                      );
                      const assignResponse = await makeRequest(
                        "PUT",
                        `/api/users/update-doc/${existingId}`,
                        { data: updatePayload }
                      );
                      if (
                        assignResponse.status === 200 ||
                        assignResponse.status === 204
                      ) {
                        createdOrgs[orgIndex].userIds.push(existingId);
                        const userType =
                          user.user_role === "ADMIN" ? "[ADMIN]" : "[USER ]";
                        console.log(
                          `    ${colors.green}✓${colors.reset} ${userType} ${user.first_name} ${user.last_name}`
                        );
                      } else {
                        log.error(
                          `    ${user.first_name} ${user.last_name} - Failed to update existing user (status ${assignResponse.status})`
                        );
                        try {
                          console.log(
                            JSON.stringify(assignResponse.data, null, 2)
                          );
                        } catch (e) {
                          console.log(assignResponse.data);
                        }
                      }
                    } else {
                      log.warn(
                        `    Could not locate existing user for ${user.email}`
                      );
                    }
                  } catch (err) {
                    log.error(
                      `    Error while fetching existing user: ${err.message}`
                    );
                  }
                }
              }
            } catch (err) {
              log.error(
                `    ${user.first_name} ${user.last_name} - ${err.message}`
              );
            }
            await delay(200);
          }
        } else {
          log.error(`${orgData.org_name} - Status ${orgResponse.status}`);
          try {
            console.log(JSON.stringify(orgResponse.data, null, 2));
          } catch (e) {
            console.log(orgResponse.data);
          }
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
            const kitUpdateResponse = await makeRequest(
              "PUT",
              `/api/kits/${kit.id}`,
              {
                data: { orgs: [org.id] },
              }
            );

            if (
              kitUpdateResponse.status === 200 ||
              kitUpdateResponse.status === 204
            ) {
              log.success(`${kit.name} → ${org.org_name}`);
            } else {
              log.error(
                `${kit.name} → ${org.org_name} - Status ${kitUpdateResponse.status}`
              );
              try {
                console.log(JSON.stringify(kitUpdateResponse.data, null, 2));
              } catch (e) {
                console.log(kitUpdateResponse.data);
              }
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
