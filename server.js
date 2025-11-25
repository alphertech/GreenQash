<!-- Include Supabase client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js"></script>
<script>
  // CONFIG - replace with your values
  const SUPABASE_URL = 'https://kwghulqonljulmvlcfnz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';

  // Initialize client
  const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Utility: set innerText for element with given id
  function setInnerTextIfExists(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.innerText = value === null || value === undefined ? '' : String(value);
    return true;
  }

  // Fetch a single row by primary key and map columns to DOM elements
  async function fetchAndBindRow(table, pkColumn, pkValue, opts = {}) {
    if (!table || !pkColumn) {
      console.error('table and pkColumn are required');
      return null;
    }

    try {
      const select = opts.select ?? '*';
      const { data, error, status } = await supabase
        .from(table)
        .select(select)
        .eq(pkColumn, pkValue)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        return null;
      }
      if (!data) {
        console.warn(`No row found in ${table} where ${pkColumn} = ${pkValue}`);
        return null;
      }

      // Map each column to element with same id
      Object.entries(data).forEach(([col, val]) => {
        setInnerTextIfExists(col, val);
      });

      // Also set an element with id equal to table name with the full JSON (optional)
      setInnerTextIfExists(table, JSON.stringify(data, null, 2));

      return data;
    } catch (err) {
      console.error('Unexpected error in fetchAndBindRow:', err);
      return null;
    }
  }

  // Example usage: adjust to your page
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting data loading...');
    
    // Option A: if your page already contains an element with id="id" containing the user id
    const userIdStr = document.getElementById('id')?.innerText?.trim();
    const userId = userIdStr ? (isNaN(userIdStr) ? userIdStr : Number(userIdStr)) : null;

    // If you have a user id
    if (userId !== null) {
      console.log(`👤 Loading data for user ID: ${userId}`);
      
      // Fill user fields (ids like 'user_name', 'email_address', 'total_income')
      await fetchAndBindRow('users', 'id', userId, { select: 'id,user_name,email_address,total_income,last_login' });

      // Fill earnings fields (ids like 'youtube', 'tiktok', 'all_time_earn', 'total_withdrawn')
      await fetchAndBindRow('earnings', 'id', userId);

      // Fill payment information (ids like 'mobile_number', 'payment_method', 'email', 'notification_preference')
      await fetchAndBindRow('payment_information', 'id', userId);
    } else {
      // Option B: hard-coded id values (example)
      console.log('⚠️ No user ID found, using demo ID: 1');
      await fetchAndBindRow('users', 'id', 1);
      await fetchAndBindRow('earnings', 'id', 1);
      await fetchAndBindRow('payment_information', 'id', 1);
    }

    // Example: if you want to load a content post by post_id found in element id="post_id"
    const postIdStr = document.getElementById('post_id')?.innerText?.trim();
    if (postIdStr) {
      const postId = isNaN(postIdStr) ? postIdStr : Number(postIdStr);
      await fetchAndBindRow('contents', 'post_id', postId);
    }
    
    console.log('✅ Data loading complete!');
  });
</script>
