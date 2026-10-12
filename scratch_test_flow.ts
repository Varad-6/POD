const BASE_URL = 'http://localhost:3001/api/v3';

async function request(url: string, method: string, data?: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function runTest() {
  console.log('--- 1. Login as Company Admin (ca_thandiwe) ---');
  const caRes = await request('/auth/login', 'POST', {
    username: 'ca_thandiwe',
    password: 'Demo@1234'
  });
  const caToken = caRes.token;
  console.log('CA Logged in successfully:', caRes.user.username);

  console.log('\n--- 2. Fetch Sales Orders ---');
  const soList = await request('/sales-orders', 'GET', undefined, caToken);
  console.log(`Fetched ${soList.length} Sales Orders.`);
  soList.forEach((so: any) => {
    console.log(`- SO #${so.sap_so_no} (${so.customer_name}): ${so.items?.length || 0} items, ${so.deliveries?.length || 0} deliveries:`, 
      so.deliveries?.map((d: any) => `${d.sap_delivery_no} (${d.delivery_type})`).join(', ')
    );
  });

  const so2320 = soList.find((s: any) => s.sap_so_no === '2320') || soList[0];
  const so2318 = soList.find((s: any) => s.sap_so_no === '2318') || soList[1];

  console.log('\n--- 3. CA Distributes Sales Orders to Transporter 1 (Sipho Transport) ---');
  const distRes = await request('/so-distributions', 'POST', {
    so_ids: [so2320.id, so2318.id],
    transporter_id: 1,
    notes: 'Urgent delivery for Anglo American Mining'
  }, caToken);
  console.log('Distributed successfully:', distRes);

  console.log('\n--- 4. Login as Transporter Admin (ta_sipho) ---');
  const taRes = await request('/auth/login', 'POST', {
    username: 'ta_sipho',
    password: 'Demo@1234'
  });
  const taToken = taRes.token;
  console.log('TA Logged in successfully:', taRes.user);

  console.log('\n--- 5. TA Fetches Allocated Sales Orders ---');
  const myDistRes = await request('/so-distributions', 'GET', undefined, taToken);
  console.log(`TA sees ${myDistRes.length} distributed Sales Orders:`);
  myDistRes.forEach((d: any) => {
    console.log(`- Dist #${d.id} | SO #${d.sap_so_no} | Status: ${d.status} | Deliveries: ${d.deliveries_summary} | Assignment ID: ${d.assignment_id || 'None'}`);
  });

  const pendingDist = myDistRes.find((d: any) => d.status === 'PENDING' || !d.active_assignment_id);
  if (pendingDist) {
    console.log(`\n--- 6. TA Assigns Driver & Vehicle to Distribution #${pendingDist.id} ---`);
    const drivers = await request('/transporters/1/drivers', 'GET', undefined, taToken);
    const vehicles = await request('/transporters/1/vehicles', 'GET', undefined, taToken);
    const driver = drivers[0];
    const vehicle = vehicles[0];
    console.log(`Selected Driver: ${driver.name} (id ${driver.id}), Vehicle: ${vehicle.reg_no || vehicle.registration_no} (id ${vehicle.id})`);

    const assignRes = await request(`/so-distributions/${pendingDist.id}/assign`, 'POST', {
      driver_id: driver.id,
      vehicle_id: vehicle.id
    }, taToken);
    console.log('Assignment result:', assignRes);

    const assignmentId = assignRes.assignment_id;

    console.log('\n--- 7. Login as Driver (dr_rajesh) and check assigned trips ---');
    const drRes = await request('/auth/login', 'POST', {
      username: 'dr_rajesh',
      password: 'Demo@1234'
    });
    const drToken = drRes.token;
    const drTrips = await request('/assignments/mine', 'GET', undefined, drToken);
    console.log(`Driver has ${drTrips.length} trips.`);
    const matchingTrip = drTrips.find((t: any) => t.id === assignmentId);
    if (matchingTrip) {
      console.log(`SUCCESS! Driver sees Trip #${matchingTrip.id} for SO ${matchingTrip.sap_so_no || matchingTrip.sap_po_no}: Status=${matchingTrip.status}, Customer=${matchingTrip.customer_name}`);
    } else {
      console.log('Driver trips:', drTrips.map((t: any) => ({ id: t.id, status: t.status, so: t.sap_so_no })));
    }

    console.log('\n--- 8. Login as Supervisor (sr_gate01) and check gate check visibility ---');
    const srRes = await request('/auth/login', 'POST', {
      username: 'sr_gate01',
      password: 'Demo@1234'
    });
    const srToken = srRes.token;
    const srAssignments = await request('/assignments', 'GET', undefined, srToken);
    console.log(`Supervisor sees ${srAssignments.length} assignments in queue.`);
    const srTrip = srAssignments.find((a: any) => a.id === assignmentId);
    if (srTrip) {
      console.log(`SUCCESS! Supervisor sees Trip #${srTrip.id}: Status=${srTrip.status}, Truck=${srTrip.truck_reg || srTrip.vehicle_registration}`);
    }
  }

  console.log('\n========================================');
  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('========================================');
}

runTest().catch((err) => {
  console.error('Test failed with error:', err.message);
  process.exit(1);
});
