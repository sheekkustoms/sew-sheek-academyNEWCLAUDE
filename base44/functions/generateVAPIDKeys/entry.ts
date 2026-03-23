import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    // Generate VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys();

    console.log('[generateVAPIDKeys] Generated new VAPID keys');

    return Response.json({
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      instructions: 'Copy these keys and add them as secrets: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY',
    });
  } catch (error) {
    console.error('[generateVAPIDKeys]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});