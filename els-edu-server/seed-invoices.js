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

async function seedInvoiceData() {
  console.log('🧾 Starting Invoice Data Seeding...');
  
  try {
    // Get existing data
    console.log('\n📊 Fetching existing data...');
    const [orgsRes, coursesRes, subjectsRes, pricingsRes, offersRes] = await Promise.all([
      apiCall('GET', 'orgs'),
      apiCall('GET', 'courses'),
      apiCall('GET', 'subjects'),
      apiCall('GET', 'pricings'),
      apiCall('GET', 'offers')
    ]);
    
    const orgs = orgsRes.data;
    const courses = coursesRes.data;
    const subjects = subjectsRes.data;
    const pricings = pricingsRes.data;
    const offers = offersRes.data;
    
    console.log(`Found: ${orgs.length} orgs, ${courses.length} courses, ${subjects.length} subjects, ${pricings.length} pricings, ${offers.length} offers`);
    
    if (orgs.length === 0 || courses.length === 0) {
      throw new Error('No organizations or courses found. Please run the basic seeding first.');
    }
    
    // Step 1: Create Sample Invoices
    console.log('\n🧾 Creating Sample Invoices...');
    
    const invoiceData = [
      {
        invoice_number: "INV-2025-001",
        invoice_type: "ORG_INVOICE", 
        invoice_status: "PAID",
        org: orgs[0].id, // TechEd Solutions
        course: courses[0].id, // Full Stack Web Development
        subtotal: 45000,
        tax_amount: 8100, // 18% GST
        discount_amount: 0,
        total_amount: 53100,
        currency: "INR",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paid_date: new Date().toISOString(),
        payment_terms: "Net 30",
        notes: "Full Stack Web Development Bootcamp - Regular Package",
        billing_address: {
          company: "TechEd Solutions Private Limited",
          address: "123 Tech Park, Bangalore",
          city: "Bangalore", 
          state: "Karnataka",
          pincode: "560001",
          gstin: "29ABCDE1234F1Z5"
        }
      },
      {
        invoice_number: "INV-2025-002",
        invoice_type: "ORG_INVOICE",
        invoice_status: "PENDING", 
        org: orgs[1].id, // EduCare Learning
        course: courses[2].id, // CBSE Class 10
        subtotal: 15000,
        tax_amount: 2430, // 18% GST on discounted amount
        discount_amount: 1500, // 10% discount
        total_amount: 15930,
        currency: "INR",
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: "Net 15",
        notes: "CBSE Class 10 Complete Package - Annual Subscription",
        billing_address: {
          company: "EduCare Learning Institute",
          address: "456 Education Lane, Mumbai", 
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          gstin: "27FGHIJ5678K1L9"
        }
      },
      {
        invoice_number: "INV-2025-003",
        invoice_type: "ORG_INVOICE",
        invoice_status: "PARTIALLY_PAID",
        org: orgs[0].id, // TechEd Solutions 
        course: courses[1].id, // Data Science & ML
        subtotal: 55000,
        tax_amount: 9900, // 18% GST
        discount_amount: 8250, // Early bird 15% discount
        total_amount: 56650,
        currency: "INR", 
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: "Net 45",
        notes: "Data Science & Machine Learning - Standard Package with Early Bird Discount",
        billing_address: {
          company: "TechEd Solutions Private Limited",
          address: "123 Tech Park, Bangalore",
          city: "Bangalore",
          state: "Karnataka", 
          pincode: "560001",
          gstin: "29ABCDE1234F1Z5"
        }
      }
    ];
    
    const createdInvoices = [];
    for (const invoice of invoiceData) {
      console.log(`Creating invoice: ${invoice.invoice_number}`);
      const result = await apiCall('POST', 'invoices', { data: invoice });
      createdInvoices.push(result.data);
      console.log(`✅ Created invoice ID: ${result.data.id} - ${invoice.invoice_number} (₹${invoice.total_amount})`);
    }
    
    // Step 2: Create Invoice Items for each invoice
    console.log('\n📋 Creating Invoice Items...');
    
    const invoiceItemsData = [];
    
    // Items for Invoice 1 (Full Stack Regular)
    invoiceItemsData.push({
      invoice: createdInvoices[0].id,
      item_type: "COURSE",
      item_name: "Full Stack Web Development - Frontend Module",
      item_description: "React.js, JavaScript, HTML/CSS fundamentals and advanced concepts",
      course: courses[0].id,
      subject: subjects[0].id, // Frontend Development
      quantity: 1,
      unit_price: 15000,
      line_total: 15000,
      tax_rate: 18,
      tax_amount: 2700,
      discount_rate: 0,
      discount_amount: 0,
      net_amount: 17700
    });
    
    invoiceItemsData.push({
      invoice: createdInvoices[0].id,
      item_type: "COURSE", 
      item_name: "Full Stack Web Development - Backend Module",
      item_description: "Node.js, Express.js, API development and server management",
      course: courses[0].id,
      subject: subjects[1].id, // Backend Development
      quantity: 1,
      unit_price: 15000,
      line_total: 15000,
      tax_rate: 18,
      tax_amount: 2700,
      discount_rate: 0,
      discount_amount: 0,
      net_amount: 17700
    });
    
    invoiceItemsData.push({
      invoice: createdInvoices[0].id,
      item_type: "COURSE",
      item_name: "Full Stack Web Development - Database Module", 
      item_description: "Database design, MongoDB, PostgreSQL, and data modeling",
      course: courses[0].id,
      subject: subjects[2].id, // Database Design
      quantity: 1,
      unit_price: 15000,
      line_total: 15000,
      tax_rate: 18,
      tax_amount: 2700,
      discount_rate: 0, 
      discount_amount: 0,
      net_amount: 17700
    });
    
    // Items for Invoice 2 (CBSE Class 10)
    invoiceItemsData.push({
      invoice: createdInvoices[1].id,
      item_type: "SUBJECT",
      item_name: "Mathematics Class 10",
      item_description: "Complete CBSE Mathematics curriculum with practice tests",
      course: courses[2].id,
      subject: subjects[6].id, // Mathematics Class 10
      quantity: 1,
      unit_price: 5000,
      line_total: 4500, // 10% discount applied
      tax_rate: 18,
      tax_amount: 810,
      discount_rate: 10,
      discount_amount: 500,
      net_amount: 5310
    });
    
    invoiceItemsData.push({
      invoice: createdInvoices[1].id,
      item_type: "SUBJECT",
      item_name: "Science Class 10",
      item_description: "Physics, Chemistry, Biology - Complete CBSE curriculum",
      course: courses[2].id,
      subject: subjects[7].id, // Science Class 10
      quantity: 1,
      unit_price: 5000,
      line_total: 4500,
      tax_rate: 18,
      tax_amount: 810,
      discount_rate: 10,
      discount_amount: 500,
      net_amount: 5310
    });
    
    invoiceItemsData.push({
      invoice: createdInvoices[1].id,
      item_type: "SUBJECT", 
      item_name: "Social Studies Class 10",
      item_description: "History, Geography, Political Science, Economics",
      course: courses[2].id,
      subject: subjects[8].id, // Social Studies Class 10
      quantity: 1,
      unit_price: 5000,
      line_total: 4500,
      tax_rate: 18,
      tax_amount: 810,
      discount_rate: 10,
      discount_amount: 500,
      net_amount: 5310
    });
    
    // Items for Invoice 3 (Data Science with Early Bird)
    invoiceItemsData.push({
      invoice: createdInvoices[2].id,
      item_type: "COURSE",
      item_name: "Python for Data Science",
      item_description: "Python programming, NumPy, Pandas, data manipulation",
      course: courses[1].id,
      subject: subjects[3].id, // Python for Data Science
      quantity: 1,
      unit_price: 20000,
      line_total: 17000, // 15% early bird discount
      tax_rate: 18,
      tax_amount: 3060,
      discount_rate: 15,
      discount_amount: 3000,
      net_amount: 20060
    });
    
    invoiceItemsData.push({
      invoice: createdInvoices[2].id,
      item_type: "COURSE",
      item_name: "Machine Learning Algorithms",
      item_description: "Supervised, unsupervised learning, deep learning fundamentals",
      course: courses[1].id, 
      subject: subjects[4].id, // Machine Learning Algorithms
      quantity: 1,
      unit_price: 25000,
      line_total: 21250, // 15% early bird discount
      tax_rate: 18,
      tax_amount: 3825,
      discount_rate: 15,
      discount_amount: 3750,
      net_amount: 25075
    });
    
    invoiceItemsData.push({
      invoice: createdInvoices[2].id,
      item_type: "COURSE",
      item_name: "Data Visualization & Analytics",
      item_description: "Matplotlib, Seaborn, Plotly, business intelligence tools",
      course: courses[1].id,
      subject: subjects[5].id, // Data Visualization
      quantity: 1,
      unit_price: 10000,
      line_total: 8500, // 15% early bird discount
      tax_rate: 18,
      tax_amount: 1530,
      discount_rate: 15,
      discount_amount: 1500,
      net_amount: 10030
    });
    
    const createdInvoiceItems = [];
    for (const item of invoiceItemsData) {
      console.log(`Creating invoice item: ${item.item_name}`);
      const result = await apiCall('POST', 'invoice-items', { data: item });
      createdInvoiceItems.push(result.data);
      console.log(`✅ Created item ID: ${result.data.id} - ₹${item.net_amount}`);
    }
    
    // Step 3: Create Invoice Payments
    console.log('\n💳 Creating Invoice Payments...');
    
    const paymentData = [
      {
        invoice: createdInvoices[0].id,
        payment_reference: "PAY-2025-001",
        payment_gateway: "CASHFREE", 
        gateway_transaction_id: "CF_TXN_001_" + Date.now(),
        amount: 53100,
        currency: "INR",
        payment_status: "SUCCESS",
        payment_date: new Date().toISOString(),
        payment_method_details: {
          method: "UPI",
          upi_id: "teched@paytm",
          bank: "PAYTM_BANK"
        }
      },
      {
        invoice: createdInvoices[2].id, // Partial payment for Data Science course
        payment_reference: "PAY-2025-002",
        payment_gateway: "RAZORPAY",
        gateway_transaction_id: "RZP_TXN_002_" + Date.now(),
        amount: 30000, // Partial payment
        currency: "INR",
        payment_status: "SUCCESS",
        payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        payment_method_details: {
          method: "NET_BANKING",
          bank: "HDFC_BANK",
          account_last_4: "1234"
        }
      }
    ];
    
    const createdPayments = [];
    for (const payment of paymentData) {
      console.log(`Creating payment: ${payment.payment_reference}`);
      const result = await apiCall('POST', 'invoice-payments', { data: payment });
      createdPayments.push(result.data);
      console.log(`✅ Created payment ID: ${result.data.id} - ₹${payment.amount} (${payment.payment_status})`);
    }
    
    console.log('\n🎉 Invoice Data Seeding Completed!');
    console.log('\n📋 Summary:');
    console.log(`   Invoices: ${createdInvoices.length}`);
    console.log(`   Invoice Items: ${createdInvoiceItems.length}`);
    console.log(`   Payments: ${createdPayments.length}`);
    
    console.log('\n🧾 Invoice Summary:');
    createdInvoices.forEach((invoice, index) => {
      const relatedItems = createdInvoiceItems.filter(item => 
        item.attributes.invoice?.data?.id === invoice.id
      );
      const relatedPayments = createdPayments.filter(payment => 
        payment.attributes.invoice?.data?.id === invoice.id  
      );
      
      console.log(`  📄 ${invoice.attributes.invoice_number}:`);
      console.log(`     Status: ${invoice.attributes.invoice_status}`);
      console.log(`     Total: ₹${invoice.attributes.total_amount}`);
      console.log(`     Items: ${invoiceItemsData.filter(item => item.invoice === invoice.id).length}`);
      console.log(`     Payments: ${paymentData.filter(payment => payment.invoice === invoice.id).length}`);
    });
    
    console.log('\n✨ All invoice-related data has been successfully created!');
    console.log('   You can now view invoices, invoice-items, and invoice-payments in React-Admin.');
    
  } catch (error) {
    console.error('❌ Error during invoice seeding:', error.message);
    process.exit(1);
  }
}

seedInvoiceData()
  .then(() => {
    console.log('\n🎯 Invoice seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Invoice seeding failed:', error);
    process.exit(1);
  });