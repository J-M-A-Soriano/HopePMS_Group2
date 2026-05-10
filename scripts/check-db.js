const url = "https://chhrszguevqdpitbrprh.supabase.co/rest/v1/user?select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaHJzemd1ZXZxZHBpdGJycHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODU4NjQsImV4cCI6MjA5MDE2MTg2NH0.IIVFoiK6xsFo5nH-5KmdX_Kvtd5CEkk3NDe7y96sqtg";

async function run() {
  const query = encodeURIComponent(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname IN ('product', 'user')
  `);
  const res = await fetch("https://chhrszguevqdpitbrprh.supabase.co/rest/v1/rpc/check_rls", {
    // If we don't have an RPC, we can't easily query system catalogs via REST anonymously unless exposed...
  });
  console.log(await res.text());
}
run();
