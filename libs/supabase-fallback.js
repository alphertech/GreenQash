// Minimal local fallback for Supabase client when CDN is blocked/unavailable.
// This is not the full Supabase library. It provides small, safe stubs so the app
// does not crash when `window.supabase` is missing. For full functionality, replace
// this file with the real `supabase.min.js` bundle.
(function () {
    if (window.supabase) return; // don't overwrite real client

    console.warn('Using local Supabase fallback. Functionality will be limited.');

    function Query() {
        this._ops = {};
    }
    Query.prototype.select = function () { return this; };
    Query.prototype.eq = function () { return this; };
    Query.prototype.order = function () { return this; };
    Query.prototype.limit = function () { return this; };
    // allow awaiting the query: await query -> { data: [], error: null }
    Query.prototype.then = function (resolve) {
        // resolve with empty data and no error so UI can gracefully fallback
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
    };

    function From(table) {
        this.table = table;
        return new Query();
    }

    function SupabaseClient() {}
    SupabaseClient.prototype.from = function (table) { return new Query(); };
    SupabaseClient.prototype.auth = {
        getUser: function () { return Promise.resolve({ data: { user: null } }); }
    };

    window.supabase = {
        // mimic the library exposing createClient; user code may call window.supabase.createClient
        createClient: function (url, key) {
            return new SupabaseClient();
        }
    };
})();
