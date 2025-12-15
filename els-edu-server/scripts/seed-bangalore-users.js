const axios = require('axios');

// Configuration
const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
};

// Bangalore popular locations with realistic coordinates
const bangaloreLocations = [
    { area: 'Koramangala', lat: 12.9352, lng: 77.6245 },
    { area: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
    { area: 'Whitefield', lat: 12.9698, lng: 77.7499 },
    { area: 'Jayanagar', lat: 12.9250, lng: 77.5838 },
    { area: 'Marathahalli', lat: 12.9591, lng: 77.6974 },
    { area: 'HSR Layout', lat: 12.9116, lng: 77.6423 },
    { area: 'BTM Layout', lat: 12.9165, lng: 77.6101 },
    { area: 'Electronic City', lat: 12.8456, lng: 77.6603 },
    { area: 'Malleshwaram', lat: 13.0059, lng: 77.5706 },
    { area: 'Rajajinagar', lat: 12.9917, lng: 77.5542 }
];

// Sample user data
const timestamp = Date.now();
const users = [
    { username: `arjun_blr_${timestamp}`, email: `arjun_${timestamp}@example.com`, name: 'Arjun Kumar' },
    { username: `priya_blr_${timestamp}`, email: `priya_${timestamp}@example.com`, name: 'Priya Sharma' },
    { username: `rahul_blr_${timestamp}`, email: `rahul_${timestamp}@example.com`, name: 'Rahul Patel' },
    { username: `sneha_blr_${timestamp}`, email: `sneha_${timestamp}@example.com`, name: 'Sneha Reddy' },
    { username: `vikram_blr_${timestamp}`, email: `vikram_${timestamp}@example.com`, name: 'Vikram Singh' },
    { username: `anjali_blr_${timestamp}`, email: `anjali_${timestamp}@example.com`, name: 'Anjali Gupta' },
    { username: `karthik_blr_${timestamp}`, email: `karthik_${timestamp}@example.com`, name: 'Karthik Rao' },
    { username: `meera_blr_${timestamp}`, email: `meera_${timestamp}@example.com`, name: 'Meera Iyer' },
    { username: `aditya_blr_${timestamp}`, email: `aditya_${timestamp}@example.com`, name: 'Aditya Nair' },
    { username: `divya_blr_${timestamp}`, email: `divya_${timestamp}@example.com`, name: 'Divya Menon' }
];

async function createAddress(locationData, area) {
    try {
        // Add small random offset for variety (within ~500m)
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;

        const addressData = {
            data: {
                address_line1: `${Math.floor(Math.random() * 200) + 1}, ${area} Main Road`,
                address_line2: `${area}`,
                city: 'Bangalore',
                state: 'Karnataka',
                postal_code: `560${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
                country: 'India',
                landmark: `Near ${area} Metro`,
                latitude: (locationData.lat + latOffset).toFixed(6),
                longitude: (locationData.lng + lngOffset).toFixed(6)
            }
        };

        console.log('  → Address payload:', JSON.stringify(addressData, null, 2));
        const response = await axios.post(`${STRAPI_URL}/api/addresses`, addressData, { headers });
        console.log('  → Address response:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    } catch (error) {
        console.error('Error creating address:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('  Message:', error.message);
        }
        return null;
    }
}

async function createUser(userData, addressData) {
    try {
        const password = 'Test@1234'; // Simple password for testing

        const userPayload = {
            username: userData.username,
            email: userData.email,
            password: password,
            confirmed: true,
            blocked: false,
            role: 1, // Authenticated user role ID
            home_address: addressData.id // Use numeric ID, not documentId
        };

        const response = await axios.post(`${STRAPI_URL}/api/users`, userPayload, { headers });
        return response.data;
    } catch (error) {
        console.error(`Error creating user ${userData.username}:`, error.response?.data || error.message);
        return null;
    }
}

async function seedBangaloreUsers() {
    console.log('==================================================');
    console.log('Seeding Bangalore Users with Locations');
    console.log('==================================================\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const location = bangaloreLocations[i];

        console.log(`\n[${i + 1}/${users.length}] Creating user: ${user.name} (${location.area})`);

        // Create address
        console.log(`  → Creating address in ${location.area}...`);
        const address = await createAddress(location, location.area);

        if (!address) {
            console.log(`  ✗ Failed to create address`);
            failCount++;
            continue;
        }

        console.log(`  ✓ Address created (ID: ${address.id}, Lat: ${address.latitude}, Lng: ${address.longitude})`);

        // Create user with address
        console.log(`  → Creating user account...`);
        const createdUser = await createUser(user, address);

        if (!createdUser) {
            console.log(`  ✗ Failed to create user`);
            failCount++;
            continue;
        }

        console.log(`  ✓ User created (ID: ${createdUser.id}, Username: ${createdUser.username})`);
        successCount++;
    }

    console.log('\n==================================================');
    console.log('Summary');
    console.log('==================================================');
    console.log(`✓ Successfully created: ${successCount} users`);
    console.log(`✗ Failed to create: ${failCount} users`);

    if (successCount > 0) {
        console.log('\nTest Login Credentials (first user):');
        console.log(`Username: ${users[0].username}`);
        console.log('Password: Test@1234');
    }
    console.log('==================================================\n');
}

// Run the seeder
seedBangaloreUsers().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
