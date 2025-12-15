const http = require("http");

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

async function login() {
  try {
    const resp = await makeRequest("POST", "/api/auth/local", {
      identifier: "admin-org1@demo.test",
      password: "AdminPass123!"
    });
    if (resp.status === 200 && resp.data.jwt) {
      log.success("Logged in successfully");
      return resp.data.jwt;
    } else {
      log.error("Login failed: " + JSON.stringify(resp.data));
      return null;
    }
  } catch (err) {
    log.error("Login error: " + err.message);
    return null;
  }
}

async function seedPricing() {
  log.header("🌱 Seeding Pricing Plans...");

  try {
    // 0. Login
    const token = await login();
    if (token) {
      adminToken = token;
    } else {
      log.warn("Proceeding without token (might fail)...");
    }

    // 1. Fetch all kits
    log.info("Fetching kits...");
    const kitsResp = await makeRequest("GET", "/api/kits?populate=*");
    const kits = kitsResp.data.data || [];

    if (kits.length === 0) {
      log.warn("No kits found.");
      return;
    }

    log.info(`Found ${kits.length} kits.`);

    for (const kit of kits) {
      if (kit.kit_type === "PAID" || kit.kit_type === "FREEMIUM") {
        log.info(`Processing kit: ${kit.name} (${kit.kit_type})`);

        // Check if pricing already exists
        if (kit.pricings && kit.pricings.length > 0) {
          log.info(`  Pricing already exists for ${kit.name}. Skipping.`);
          continue;
        }

        // Create Pricing Plans
        const plans = [
          {
            name: "Monthly Access",
            amount: 499,
            currency: "INR",
            option: "MONTHLY",
            duration: 1,
            description: [
              {
                type: "paragraph",
                children: [{ type: "text", text: "Full access for 1 month" }]
              }
            ],
            is_featured: false,
            features: ["All levels unlocked", "Certificate of completion", "Email support"],
            kit: { connect: [{ documentId: kit.documentId }] }
          },
          {
            name: "Yearly Pro",
            amount: 4999,
            currency: "INR",
            option: "YEARLY",
            duration: 1,
            description: [
              {
                type: "paragraph",
                children: [{ type: "text", text: "Best value for long-term learning" }]
              }
            ],
            is_featured: true,
            discount_percent: 20,
            discount_valid_until: "2025-12-31",
            features: ["All levels unlocked", "Priority support", "Offline downloads", "Mentorship session"],
            kit: { connect: [{ documentId: kit.documentId }] }
          }
        ];

        for (const plan of plans) {
          try {
            const resp = await makeRequest("POST", "/api/pricings", { data: plan });
            if (resp.status === 200 || resp.status === 201) {
              log.success(`  Created plan: ${plan.title}`);
            } else {
              log.error(`  Failed to create plan ${plan.title}: ${resp.status} - ${JSON.stringify(resp.data)}`);
            }
          } catch (err) {
            log.error(`  Error creating plan ${plan.title}: ${err.message}`);
          }
        }
      } else {
        log.info(`Skipping ${kit.name} (Type: ${kit.kit_type})`);
      }
    }

    log.header("✅ Pricing seeding completed!");

  } catch (err) {
    log.error(`Seeding failed: ${err.message}`);
  }
}

seedPricing();
