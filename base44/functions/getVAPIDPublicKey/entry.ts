Deno.serve(async (req) => {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  return Response.json({ publicKey });
});