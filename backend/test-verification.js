const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hireflow-jwt-secret-change-in-production';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Verification Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  // Test 1: Login with Demo User
  console.log('1. Testing Login with Demo Recruiter...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'demo@hireflow.ai', password: 'demo123' });

  assert(loginRes.status === 200, `Login returns status 200 (got ${loginRes.status})`);
  assert(loginRes.data && loginRes.data.token, 'Login returns JWT token');
  assert(loginRes.data && loginRes.data.recruiter, 'Login returns recruiter object');
  assert(UUID_REGEX.test(loginRes.data?.recruiter?.id), `Recruiter ID is a valid UUID (${loginRes.data?.recruiter?.id})`);
  assert(loginRes.data?.recruiter?.id === '00000000-0000-4000-8000-000000000001', 'Recruiter ID is canonical demo UUID');

  const validToken = loginRes.data.token;

  // Test 2: Profile with Valid Token
  console.log('\n2. Testing GET /api/auth/profile with valid token...');
  const profileRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/profile',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validToken}` }
  });

  assert(profileRes.status === 200, `Profile returns status 200 (got ${profileRes.status})`);
  assert(UUID_REGEX.test(profileRes.data?.id), `Profile ID is valid UUID (${profileRes.data?.id})`);
  assert(profileRes.data?.email === 'demo@hireflow.ai', 'Profile email matches demo@hireflow.ai');

  // Test 3: Dashboard with Valid Token
  console.log('\n3. Testing GET /api/dashboard with valid token...');
  const dashRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/dashboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validToken}` }
  });

  assert(dashRes.status === 200, `Dashboard returns status 200 (got ${dashRes.status})`);
  assert(dashRes.data && typeof dashRes.data.active_jobs === 'number', 'Dashboard returns active_jobs count');

  // Test 4: Jobs with Valid Token
  console.log('\n4. Testing GET /api/jobs with valid token...');
  const jobsRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/jobs',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validToken}` }
  });

  assert(jobsRes.status === 200, `Jobs returns status 200 (got ${jobsRes.status})`);
  assert(Array.isArray(jobsRes.data), 'Jobs returns an array');
  if (jobsRes.data.length > 0) {
    assert(UUID_REGEX.test(jobsRes.data[0].id), `Job ID is valid UUID (${jobsRes.data[0].id})`);
    assert(jobsRes.data[0].recruiter_id === '00000000-0000-4000-8000-000000000001', 'Job recruiter_id matches canonical UUID');
  }

  // Test 5: Legacy non-UUID Token ("demo-recruiter-001")
  console.log('\n5. Testing GET /api/auth/profile with legacy "demo-recruiter-001" token...');
  const legacyToken = jwt.sign({ id: 'demo-recruiter-001', email: 'demo@hireflow.ai' }, JWT_SECRET);
  const legacyRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/profile',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${legacyToken}` }
  });

  assert(legacyRes.status === 401, `Legacy non-UUID token is rejected with 401 Unauthorized (got ${legacyRes.status})`);
  assert(legacyRes.data?.error?.includes('valid UUID'), `Error message indicates UUID requirement: "${legacyRes.data?.error}"`);

  // Test 6: Legacy non-UUID Token on Dashboard
  console.log('\n6. Testing GET /api/dashboard with legacy "demo-recruiter-001" token...');
  const legacyDashRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/dashboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${legacyToken}` }
  });

  assert(legacyDashRes.status === 401, `Legacy token on dashboard rejected with 401 (got ${legacyDashRes.status})`);

  // Test 7: Invalid UUID in parameter (e.g. GET /api/jobs/not-a-uuid)
  console.log('\n7. Testing invalid UUID parameter handling (GET /api/jobs/invalid-uuid)...');
  const invalidParamRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/jobs/invalid-uuid',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validToken}` }
  });

  assert(invalidParamRes.status === 400, `Invalid UUID parameter handled gracefully with 400 Bad Request (got ${invalidParamRes.status})`);

  console.log(`\n========================================`);
  console.log(`Result: ${passed}/${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
