import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let requestId: string;
  try {
    requestId = crypto.randomUUID();
  } catch {
    requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  console.log(`[${requestId}] ========== DELETE ACCOUNT FUNCTION STARTED ==========`);

  // Set CORS headers FIRST
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Helper function to ensure all JSON responses include CORS headers
  const sendJsonResponse = (statusCode: number, data: any) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(statusCode).json(data);
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] CORS preflight request`);
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    console.log(`[${requestId}] Method not allowed: ${req.method}`);
    return sendJsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log(`[${requestId}] Request received, parsing body...`);
    const { user_id } = req.body;

    if (!user_id) {
      console.error(`[${requestId}] Missing user_id`);
      return sendJsonResponse(400, {
        error: 'Missing required field: user_id',
      });
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      console.error(`[${requestId}] Missing Authorization header`);
      return sendJsonResponse(401, { error: 'Unauthorized: Missing Authorization header' });
    }

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      console.error(`[${requestId}] Invalid Authorization header format`);
      return sendJsonResponse(401, { error: 'Unauthorized: Invalid Authorization header format' });
    }

    const token = authHeader.substring(7);
    console.log(`[${requestId}] Token extracted, length: ${token.length}`);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing Supabase environment variables!`);
      return sendJsonResponse(500, { error: 'Server configuration error: Supabase environment variables not configured' });
    }

    // Use service role client (can verify tokens and use admin API)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user (service role can verify any user's token)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error(`[${requestId}] Invalid or expired token:`, authError);
      return sendJsonResponse(401, { error: 'Unauthorized: Invalid or expired token' });
    }

    // Verify the user_id from request body matches the authenticated user (security check)
    if (user_id !== authUser.id) {
      console.error(`[${requestId}] user_id mismatch: request body has ${user_id}, but token has ${authUser.id}`);
      return sendJsonResponse(403, { error: 'Forbidden: user_id does not match authenticated user' });
    }

    console.log(`[${requestId}] User authenticated: ${authUser.id}`);

    // 1. Delete signature file from storage if it exists
    try {
      const filePath = `${user_id}/signature.png`;
      const { error: storageError } = await supabase.storage
        .from('signatures')
        .remove([filePath]);
      
      if (storageError) {
        console.error(`[${requestId}] Error deleting signature file:`, storageError);
        // Continue with account deletion even if signature deletion fails
      } else {
        console.log(`[${requestId}] Signature file deleted successfully`);
      }
    } catch (error) {
      console.error(`[${requestId}] Error deleting signature:`, error);
      // Continue with account deletion
    }

    // 2. Delete all user data from public schema via RPC function
    console.log(`[${requestId}] Calling delete_user_account RPC function`);
    const { error: rpcError } = await supabase.rpc('delete_user_account', {
      user_uuid: user_id
    });

    if (rpcError) {
      console.error(`[${requestId}] Error deleting user data via RPC:`, rpcError);
      return sendJsonResponse(500, { 
        error: `Failed to delete account data: ${rpcError.message}` 
      });
    }

    console.log(`[${requestId}] User data deleted successfully via RPC`);

    // 3. Delete the auth user account using Admin API
    console.log(`[${requestId}] Deleting auth user account`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
    
    if (deleteError) {
      console.error(`[${requestId}] Error deleting auth user:`, deleteError);
      return sendJsonResponse(500, { 
        error: `Failed to delete auth account: ${deleteError.message}` 
      });
    }

    console.log(`[${requestId}] Auth user deleted successfully`);
    console.log(`[${requestId}] ========== DELETE ACCOUNT FUNCTION SUCCESS ==========`);

    return sendJsonResponse(200, {
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error(`[${requestId}] ========== ERROR CAUGHT ==========`);
    console.error(`[${requestId}] Error type:`, error?.constructor?.name || typeof error);
    console.error(`[${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] ========== END ERROR ==========`);

    return sendJsonResponse(500, {
      error: errorMessage || 'Internal server error',
      requestId: requestId,
    });
  }
}

