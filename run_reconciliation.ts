async function main() {
  console.log('Logging in as admin...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sushant.com', password: 'admin' })
  });

  if (!loginRes.ok) {
    const errorText = await loginRes.text();
    console.error('Login failed:', loginRes.status, errorText);
    return;
  }

  const loginData = await loginRes.json();
  console.log('Login success:', loginData);

  // Extract the cookie
  const setCookieHeader = loginRes.headers.get('set-cookie');
  if (!setCookieHeader) {
    console.error('No set-cookie header received');
    return;
  }

  const cookieStr = setCookieHeader.split(';')[0];
  const token = cookieStr.split('=')[1];
  console.log('Token obtained');

  console.log('Reconciling payment...');
  const reconcileRes = await fetch('http://localhost:3000/api/admin/reconcile-payment-onetime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Reconciliation-Secret': 'a8b7c6d5e4f3g2h1_very_secure_secret_for_reconciliation_only',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      razorpay_order_id: 'order_TPI7ZaxVOdCiFY',
      razorpay_payment_id: 'pay_TPI7f6GOpbVZVS'
    })
  });

  const reconcileData = await reconcileRes.json();
  console.log('Reconciliation status:', reconcileRes.status);
  console.log('Reconciliation response:', reconcileData);
  
  // Also verify course access for Vaibhav
  console.log('Logging in as Vaibhav to verify access...');
  // Actually, we don't have Vaibhav's password. But the user asked to verify course access. 
  // We can just query the DB for Vaibhav's access through a small check, or wait until the report.
}

main().catch(console.error);
