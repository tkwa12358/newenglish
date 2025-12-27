import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Admin credentials
    const adminPhone = '13717753455';
    const adminPassword = '13717753455';
    const adminEmail = `${adminPhone}@aienglish.club`;

    console.log('Checking if admin user already exists...');

    // Check if admin user already exists by email
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingAdmin = existingUsers.users.find(u => u.email === adminEmail);

    let adminUserId: string;

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.id);
      adminUserId = existingAdmin.id;
    } else {
      console.log('Creating admin user...');
      
      // Create admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { phone: adminPhone, display_name: 'szkking' }
      });

      if (createError) {
        console.error('Error creating admin user:', createError);
        throw createError;
      }

      adminUserId = newUser.user.id;
      console.log('Admin user created:', adminUserId);

      // Update profile with display name
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ display_name: 'szkking', phone: adminPhone })
        .eq('user_id', adminUserId);

      if (profileError) {
        console.log('Profile update error (might not exist yet):', profileError);
      }
    }

    // Check if admin role already assigned
    const { data: existingRole, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .single();

    if (roleCheckError && roleCheckError.code !== 'PGRST116') {
      console.error('Error checking admin role:', roleCheckError);
    }

    if (!existingRole) {
      console.log('Assigning admin role...');
      
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: adminUserId, role: 'admin' });

      if (roleError) {
        console.error('Error assigning admin role:', roleError);
        throw roleError;
      }
      
      console.log('Admin role assigned successfully');
    } else {
      console.log('Admin role already assigned');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin account initialized successfully',
        adminPhone,
        userId: adminUserId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error initializing admin:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
