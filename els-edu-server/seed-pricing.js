const axios = require('axios');

const API_URL = 'http://localhost:1337';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY1ODc1Nzk4LCJleHAiOjE3Njg0Njc3OTh9.CKhxfZasW3YYRb1CBiKtlqP2WUP8YAZLHJ4JMnUekB4';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
};

const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}/api/${endpoint}`,
      headers,
      ...(data && { data })
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} ${endpoint}:`, error.response?.data?.error?.message || error.message);
    throw error;
  }
};

// GST calculation helper
const calculateGST = (baseAmount, gstRate = 18) => {
  const gstAmount = Math.round((baseAmount * gstRate) / 100);
  const totalAmount = baseAmount + gstAmount;
  return { baseAmount, gstAmount, totalAmount, gstRate };
};

async function seedPricingData() {
  console.log('🌱 Starting Pricing and Invoice Data Seeding...');
  
  try {
    // Get existing data
    console.log('\n📊 Fetching existing data...');
    const [orgsRes, coursesRes, subjectsRes] = await Promise.all([
      apiCall('GET', 'orgs'),
      apiCall('GET', 'courses?populate=organization'),
      apiCall('GET', 'subjects?populate=courses')
    ]);
    
    const orgs = orgsRes.data;
    const courses = coursesRes.data;
    const subjects = subjectsRes.data;
    
    console.log(`Found: ${orgs.length} orgs, ${courses.length} courses, ${subjects.length} subjects`);
    
    // Step 1: Create Base Pricing Records
    console.log('\n💰 Creating Pricing Records...');
    const pricingData = [
      {
        name: "Full Stack Web Development - Regular",
        amount: 45000,
        description: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                text: "Complete bootcamp with placement assistance and hands-on projects"
              }
            ]
          }
        ],
        currency: "INR",
        is_active: true,
        option: "ONETIME",
        duration: 180, // 6 months
        discount_percent: 0
      },
      {
        name: "Full Stack Web Development - Premium", 
        amount: 65000,
        description: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                text: "Premium bootcamp with 1-on-1 mentoring and job guarantee"
              }
            ]
          }
        ],
        currency: "INR",
        is_active: true,
        option: "ONETIME",
        duration: 180,
        discount_percent: 5
      },
      {
        name: "Data Science & ML - Standard",
        amount: 55000,
        description: [
          {
            type: "paragraph", 
            children: [
              {
                type: "text",
                text: "Complete data science program with real-world projects and internship"
              }
            ]
          }
        ],
        currency: "INR", 
        is_active: true,
        option: "ONETIME",
        duration: 210, // 7 months
        discount_percent: 0
      },
      {
        name: "CBSE Class 10 - Annual Package",
        amount: 15000,
        description: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                text: "Complete CBSE Class 10 preparation for academic year with test series"
              }
            ]
          }
        ],
        currency: "INR",
        is_active: true,
        option: "YEARLY",
        duration: 365,
        discount_percent: 10
      },
      {
        name: "JEE/NEET Preparation - 2 Year Program",
        amount: 85000,
        description: [
          {
            type: "paragraph",
            children: [
              {
                type: "text", 
                text: "Comprehensive JEE/NEET preparation with expert faculty and test series"
              }
            ]
          }
        ],
        currency: "INR",
        is_active: true,
        option: "YEARLY",
        duration: 730, // 2 years
        discount_percent: 15
      }
    ];
    
    const createdPricings = [];
    for (const pricing of pricingData) {
      const gstCalc = calculateGST(pricing.amount);
      const finalAmount = pricing.amount - (pricing.amount * pricing.discount_percent / 100);
      const finalGstCalc = calculateGST(finalAmount);
      
      console.log(`Creating pricing: ${pricing.name}`);
      const result = await apiCall('POST', 'pricings', { data: pricing });
      createdPricings.push(result.data);
      console.log(`✅ Created pricing ID: ${result.data.id} - ₹${finalGstCalc.totalAmount} (₹${pricing.amount} base, ${pricing.discount_percent}% discount, +18% GST)`);
    }
    
    // Step 2: Create Offers (Discounts)
    console.log('\n🎯 Creating Discount Offers...');
    const offerData = [
      {
        name: "Early Bird Discount",
        description: "Special discount for early enrollments - limited time offer",
        discount_type: "PERCENTAGE",
        discount_value: 15,
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      },
      {
        name: "Student Discount", 
        description: "Special pricing for students with valid student ID",
        discount_type: "PERCENTAGE",
        discount_value: 20,
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      },
      {
        name: "Bulk Enrollment Discount",
        description: "Discount for multiple course enrollments or group bookings",
        discount_type: "FIXED",
        discount_value: 5000,
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
      }
    ];
    
    const createdOffers = [];
    for (const offer of offerData) {
      console.log(`Creating offer: ${offer.name}`);
      const result = await apiCall('POST', 'offers', { data: offer });
      createdOffers.push(result.data);
      console.log(`✅ Created offer ID: ${result.data.id} - ${offer.discount_value}${offer.discount_type === 'PERCENTAGE' ? '%' : ' INR'} off`);
    }
    
    console.log('\n🎉 Pricing and Offers Data Seeding Completed!');
    console.log('\n📋 Summary:');
    console.log(`   Base Pricings: ${createdPricings.length}`);
    console.log(`   Discount Offers: ${createdOffers.length}`);
    
    console.log('\n💰 Pricing Structure:');
    createdPricings.forEach(pricing => {
      const discountedAmount = pricing.attributes.amount - (pricing.attributes.amount * pricing.attributes.discount_percent / 100);
      const gstAmount = Math.round((discountedAmount * 18) / 100);
      const totalWithGST = discountedAmount + gstAmount;
      console.log(`  📊 ${pricing.attributes.name}: ₹${totalWithGST} (₹${pricing.attributes.amount} base, ${pricing.attributes.discount_percent}% off, +₹${gstAmount} GST)`);
    });
    
    console.log('\n🎯 Available Offers:');
    createdOffers.forEach(offer => {
      console.log(`  🏷️ ${offer.attributes.name}: ${offer.attributes.discount_value}${offer.attributes.discount_type === 'PERCENTAGE' ? '%' : ' INR'} discount`);
    });
    
    console.log('\n📝 Note: Some collections (invoices, course-pricings, etc.) have schema issues.');
    console.log('    You may need to check Strapi Admin for permissions or schema configuration.');
    console.log('    Available pricing data can now be used in your React-Admin interface.');
    
  } catch (error) {
    console.error('❌ Error during pricing seeding:', error.message);
    process.exit(1);
  }
}

seedPricingData()
  .then(() => {
    console.log('\n✨ Pricing seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pricing seeding failed:', error);
    process.exit(1);
  });