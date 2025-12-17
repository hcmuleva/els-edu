const axios = require('axios');

const API_URL = 'http://localhost:1337';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY1ODc1Nzk4LCJleHAiOjE3Njg0Njc3OTh9.CKhxfZasW3YYRb1CBiKtlqP2WUP8YAZLHJ4JMnUekB4';

console.log('🔍 Testing API permissions...');

const testPermissions = async () => {
  const resources = ['orgs', 'courses', 'subjects', 'course-pricings', 'subject-pricings', 'invoices'];
  
  for (const resource of resources) {
    try {
      const response = await axios.get(`${API_URL}/api/${resource}`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ ${resource}: ${response.data.data?.length || 0} items`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`❌ ${resource}: Permission denied - need to set API permissions`);
      } else if (error.response?.status === 404) {
        console.log(`⚠️  ${resource}: Collection not found`);
      } else {
        console.log(`❌ ${resource}: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  }
  
  console.log('\\n📋 Next steps:');
  console.log('1. Go to Strapi Admin: http://localhost:1337/admin');
  console.log('2. Settings → Users & Permissions → Roles → Authenticated');
  console.log('3. Enable permissions for the collections above');
  console.log('4. Re-run the seeding script');
};

testPermissions();