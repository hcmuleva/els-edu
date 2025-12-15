#!/usr/bin/env node

/**
 * Demo Data Seed Script - Advanced Version
 * Creates 3 demo organizations with users and kits
 * Uses Strapi's direct service methods for better reliability
 *
 * Usage: npm run seed:advanced
 */

// This will be run as a Strapi command
async function seed() {
  const strapi = require("@strapi/strapi");

  // Initialize Strapi
  let instance;
  try {
    instance = strapi();
    await instance.load();
  } catch (err) {
    console.error("Failed to load Strapi:", err);
    process.exit(1);
  }

  const logger = instance.log;
  const db = instance.db;

  console.log("\n🌱 Starting advanced demo data seeding...\n");

  try {
    // Step 1: Create Kits
    console.log("📚 Creating kits...");
    const demoKits = [
      {
        name: "React Fundamentals",
        category_type: "FRONTEND",
        experience_level: "SCHOOL",
        kit_type: "FREE",
        level: 1,
        is_featured: true,
        description:
          "Learn React basics and build interactive web applications",
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

    const createdKits = [];
    for (const kitData of demoKits) {
      try {
        const kit = await instance
          .service("plugin::content-manager.content-types.collection-types")
          .create("api::kit.kit", { data: kitData });

        if (kit?.documentId) {
          createdKits.push({ ...kitData, id: kit.documentId });
          console.log(`  ✓ Created kit: ${kitData.name}`);
        }
      } catch (err) {
        console.error(`  ✗ Failed to create kit ${kitData.name}:`, err.message);
      }
    }
    console.log(`✓ Created ${createdKits.length} kits\n`);

    // Step 2: Create Organizations with Users
    console.log("🏢 Creating organizations and users...");
    const demoOrgs = [
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

    const createdOrgs = [];

    for (let orgIndex = 0; orgIndex < demoOrgs.length; orgIndex++) {
      const orgData = demoOrgs[orgIndex];
      const orgNum = orgIndex + 1;

      try {
        // Create organization
        const org = await instance
          .service("plugin::content-manager.content-types.collection-types")
          .create("api::org.org", { data: orgData });

        if (!org?.documentId) {
          console.error(
            `  ✗ No organization ID returned for ${orgData.org_name}`
          );
          continue;
        }

        console.log(
          `  ✓ Created org: ${orgData.org_name} (ID: ${org.documentId})`
        );
        createdOrgs.push({
          ...orgData,
          id: org.documentId,
          userIds: [],
        });

        // Create admin and user accounts for this org
        console.log(`    Creating 5 users for ${orgData.org_name}...`);

        // Admin user
        const adminData = {
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
          org: org.documentId,
        };

        try {
          const adminUser = await instance
            .service("plugin::users-permissions.user")
            .create(adminData);

          if (adminUser?.documentId) {
            createdOrgs[orgIndex].userIds.push(adminUser.documentId);
            console.log(
              `    ✓ Created user [ADMIN]: ${adminData.first_name} ${adminData.last_name}`
            );
          }
        } catch (err) {
          console.error(`    ✗ Failed to create admin user:`, err.message);
        }

        // Regular student users
        const studentUsers = [
          {
            first_name: "John",
            last_name: `Student${orgNum}-1`,
            email: `john.student${orgNum}-1@demo.test`,
            username: `student${orgNum}-1`,
            password: "StudentPass123!",
            mobile_number: String(9800000001 + orgIndex * 1000),
            user_experience_level: "SCHOOL",
          },
          {
            first_name: "Sarah",
            last_name: `Student${orgNum}-2`,
            email: `sarah.student${orgNum}-2@demo.test`,
            username: `student${orgNum}-2`,
            password: "StudentPass123!",
            mobile_number: String(9800000002 + orgIndex * 1000),
            user_experience_level: "SCHOOL",
          },
          {
            first_name: "Mike",
            last_name: `Student${orgNum}-3`,
            email: `mike.student${orgNum}-3@demo.test`,
            username: `student${orgNum}-3`,
            password: "StudentPass123!",
            mobile_number: String(9800000003 + orgIndex * 1000),
            user_experience_level: "COLLEGE",
          },
          {
            first_name: "Emily",
            last_name: `Student${orgNum}-4`,
            email: `emily.student${orgNum}-4@demo.test`,
            username: `student${orgNum}-4`,
            password: "StudentPass123!",
            mobile_number: String(9800000004 + orgIndex * 1000),
            user_experience_level: "PROFESSIONAL",
          },
        ];

        for (const studentData of studentUsers) {
          try {
            const student = await instance
              .service("plugin::users-permissions.user")
              .create({
                ...studentData,
                confirmed: true,
                blocked: false,
                user_role: "USER",
                org: org.documentId,
              });

            if (student?.documentId) {
              createdOrgs[orgIndex].userIds.push(student.documentId);
              console.log(
                `    ✓ Created user [USER]: ${studentData.first_name} ${studentData.last_name}`
              );
            }
          } catch (err) {
            console.error(
              `    ✗ Failed to create student ${studentData.email}:`,
              err.message
            );
          }
        }
      } catch (err) {
        console.error(
          `  ✗ Error creating org ${orgData.org_name}:`,
          err.message
        );
      }
    }
    console.log();

    // Step 3: Randomly assign kits to organizations
    console.log("🔗 Assigning kits to organizations...");
    if (createdKits.length === 0 || createdOrgs.length === 0) {
      console.log("  ⚠ No kits or orgs created, skipping kit assignment\n");
    } else {
      for (const org of createdOrgs) {
        const kitCopy = [...createdKits];
        const selectedKits = [];

        // Select 2 random kits
        for (let i = 0; i < 2 && kitCopy.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * kitCopy.length);
          selectedKits.push(kitCopy[randomIndex]);
          kitCopy.splice(randomIndex, 1);
        }

        for (const kit of selectedKits) {
          try {
            // Get existing orgs for this kit
            const existingKit = await instance
              .service("api::kit.kit")
              .findOne(kit.id, { populate: ["orgs"] });

            const existingOrgIds =
              existingKit?.orgs?.map((o) => o.documentId) || [];

            // Add new org if not already assigned
            if (!existingOrgIds.includes(org.id)) {
              await instance.service("api::kit.kit").update(kit.id, {
                data: {
                  orgs: [...existingOrgIds, org.id],
                },
              });
            }

            console.log(
              `  ✓ Assigned kit "${kit.name}" to org "${org.org_name}"`
            );
          } catch (err) {
            console.error(`  ✗ Failed to assign kit to org:`, err.message);
          }
        }
      }
      console.log();
    }

    // Step 4: Print summary
    console.log("✅ Seed completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`  Organizations created: ${createdOrgs.length}`);
    console.log(
      `  Users created: ${createdOrgs.reduce((sum, org) => sum + org.userIds.length, 0)}`
    );
    console.log(`  Kits created: ${createdKits.length}`);
    console.log("\n📋 Demo Credentials:\n");

    createdOrgs.forEach((org, index) => {
      const orgNum = index + 1;
      console.log(`Organization: ${org.org_name}`);
      console.log(`  Admin Email: admin-org${orgNum}@demo.test`);
      console.log(`  Password: AdminPass123!`);
      console.log(`  Users: ${org.userIds.length}`);
      console.log();
    });

    console.log("🚀 You can now test your application with the demo data!\n");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await instance.destroy();
  }
}

// Run the seed
seed();
