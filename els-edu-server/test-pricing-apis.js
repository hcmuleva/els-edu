const axios = require('axios');

const API_URL = 'http://localhost:1337';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY1ODc1Nzk4LCJleHAiOjE3Njg0Njc3OTh9.CKhxfZasW3YYRb1CBiKtlqP2WUP8YAZLHJ4JMnUekB4';

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`
};

async function testEndpoints() {
  const endpoints = ['course-pricings', 'subject-pricings', 'invoices', 'invoice-items', 'invoice-payments', 'offers', 'pricing-offers', 'pricings'];
  
  console.log('🔍 Testing API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}/api/${endpoint}`, {headers});
      console.log(`✅ ${endpoint}: ${response.data.data.length} items`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

testEndpoints();